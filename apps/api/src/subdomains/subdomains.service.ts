import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { I18nService } from '../i18n/i18n.service';
import { CloudflareClient } from './cloudflare-client.service';
import { TraefikManager } from './traefik-manager.service';
import { CreateSubdomainDto } from './dto/create-subdomain.dto';
import { UpdateSubdomainDto } from './dto/update-subdomain.dto';

@Injectable()
export class SubdomainsService {
  private readonly defaultDomain: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly cloudflare: CloudflareClient,
    private readonly traefikManager: TraefikManager
  ) {
    this.defaultDomain = process.env.DEFAULT_DOMAIN || 'zedgaminghosting.hu';
  }

  /**
   * Creates a new subdomain for a game server
   */
  async create(data: CreateSubdomainDto, userId: string): Promise<any> {
    const { subdomain, domain = this.defaultDomain, serverUuid } = data;
    const fullDomain = `${subdomain}.${domain}`;

    // Validate subdomain format
    this.validateSubdomain(subdomain);

    // Check if subdomain already exists
    const existing = await this.prisma.subdomain.findFirst({
      where: {
        subdomain,
        domain,
      },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('errors.subdomain_already_exists', { domain: fullDomain })
      );
    }

    // Get server and node information
    const server = await this.prisma.gameServer.findUnique({
      where: { uuid: serverUuid },
      include: { node: true },
    });

    if (!server) {
      throw new NotFoundException(this.i18n.t('errors.server_not_found'));
    }

    // Get server HTTP port (default to 8080)
    const httpPort = server.httpPort || 8080;

    // Create DNS record in Cloudflare
    let cloudflareId: string;
    try {
      const dnsRecord = await this.cloudflare.createARecord({
        name: fullDomain,
        content: server.node.ipAddress,
        ttl: 300, // 5 minutes
      });
      cloudflareId = dnsRecord.id;
    } catch (error: any) {
      throw new Error(
        this.i18n.t('errors.cloudflare_dns_failed', { error: error.message })
      );
    }

    // Create subdomain record in database
    const subdomainRecord = await this.prisma.subdomain.create({
      data: {
        subdomain,
        domain,
        serverUuid,
        cloudflareId,
        targetIP: server.node.ipAddress,
      },
      include: {
        server: {
          include: {
            node: true,
          },
        },
      },
    });

    // Update Traefik configuration on node
    try {
      await this.traefikManager.addSubdomainRoute({
        subdomain: fullDomain,
        serverUuid,
        nodeId: server.nodeId,
        containerName: `zedhosting-${serverUuid}`,
        httpPort,
      });
    } catch (error: any) {
      // If Traefik update fails, delete DNS record and database entry
      await this.cloudflare.deleteARecord(cloudflareId);
      await this.prisma.subdomain.delete({ where: { id: subdomainRecord.id } });
      throw new Error(
        this.i18n.t('errors.traefik_update_failed', { error: error.message })
      );
    }

    return subdomainRecord;
  }

  /**
   * Lists all subdomains
   */
  async findAll(serverUuid?: string): Promise<any[]> {
    return await this.prisma.subdomain.findMany({
      where: serverUuid ? { serverUuid } : undefined,
      include: {
        server: {
          include: {
            node: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Gets a subdomain by ID
   */
  async findOne(id: string): Promise<any> {
    const subdomain = await this.prisma.subdomain.findUnique({
      where: { id },
      include: {
        server: {
          include: {
            node: true,
          },
        },
      },
    });

    if (!subdomain) {
      throw new NotFoundException(this.i18n.t('errors.subdomain_not_found'));
    }

    return subdomain;
  }

  /**
   * Updates a subdomain
   */
  async update(id: string, data: UpdateSubdomainDto): Promise<any> {
    const subdomain = await this.findOne(id);

    const updateData: any = {};

    if (data.subdomain !== undefined) {
      this.validateSubdomain(data.subdomain);
      updateData.subdomain = data.subdomain;
    }

    if (data.targetIP !== undefined) {
      updateData.targetIP = data.targetIP;

      // Update Cloudflare DNS record
      await this.cloudflare.updateARecord(subdomain.cloudflareId, {
        content: data.targetIP,
      });
    }

    const updated = await this.prisma.subdomain.update({
      where: { id },
      data: updateData,
      include: {
        server: {
          include: {
            node: true,
          },
        },
      },
    });

    // Update Traefik configuration if needed
    if (data.subdomain) {
      const fullDomain = `${data.subdomain}.${subdomain.domain}`;
      await this.traefikManager.updateSubdomainRoute({
        oldSubdomain: `${subdomain.subdomain}.${subdomain.domain}`,
        newSubdomain: fullDomain,
        serverUuid: subdomain.serverUuid,
        nodeId: subdomain.server.nodeId,
      });
    }

    return updated;
  }

  /**
   * Deletes a subdomain
   */
  async remove(id: string): Promise<void> {
    const subdomain = await this.findOne(id);

    // Delete DNS record from Cloudflare
    try {
      await this.cloudflare.deleteARecord(subdomain.cloudflareId);
    } catch (error) {
      console.error(`Failed to delete Cloudflare DNS record: ${error}`);
      // Continue with deletion even if Cloudflare fails
    }

    // Remove Traefik route
    try {
      await this.traefikManager.removeSubdomainRoute({
        subdomain: `${subdomain.subdomain}.${subdomain.domain}`,
        serverUuid: subdomain.serverUuid,
        nodeId: subdomain.server.nodeId,
      });
    } catch (error) {
      console.error(`Failed to remove Traefik route: ${error}`);
      // Continue with deletion even if Traefik update fails
    }

    // Delete database record
    await this.prisma.subdomain.delete({ where: { id } });
  }

  /**
   * Validates subdomain format
   */
  private validateSubdomain(subdomain: string): void {
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
      throw new ConflictException(
        this.i18n.t('errors.invalid_subdomain_format', { subdomain })
      );
    }

    if (subdomain.length < 3 || subdomain.length > 63) {
      throw new ConflictException(
        this.i18n.t('errors.invalid_subdomain_length', { subdomain })
      );
    }
  }
}

