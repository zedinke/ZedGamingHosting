import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';

/**
 * Subdomain Service
 * Manages server subdomains and DNS configuration
 * Integrates with CloudFlare API for DNS records
 */
@Injectable()
export class SubdomainService {
  private readonly logger = new Logger(SubdomainService.name);
  private cloudflareApiToken: string;
  private cloudflareZoneId: string;
  private primaryDomain: string;

  constructor(private readonly prisma: PrismaService) {
    this.cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN || '';
    this.cloudflareZoneId = process.env.CLOUDFLARE_ZONE_ID || '';
    this.primaryDomain = process.env.PRIMARY_DOMAIN || 'zedhosting.com';
  }

  /**
   * Create a new subdomain for a server
   */
  async createSubdomain(
    serverId: string,
    subdomain: string,
    ipAddress: string,
  ) {
    try {
      // Validate subdomain format
      if (!this.isValidSubdomain(subdomain)) {
        throw new Error('Invalid subdomain format');
      }

      // Check if subdomain already exists
      const existing = await (this.prisma as any).serverSubdomain.findUnique({
        where: { subdomain },
      });

      if (existing) {
        throw new Error('Subdomain already exists');
      }

      // Create DNS record on CloudFlare
      const dnsRecordId = await this.createDnsRecord(subdomain, ipAddress);

      // Create database entry
      const record = await (this.prisma as any).serverSubdomain.create({
        data: {
          serverId,
          subdomain,
          fullDomain: `${subdomain}.${this.primaryDomain}`,
          ipAddress,
          dnsRecordId,
          isActive: true,
        },
        include: { server: true },
      });

      this.logger.log(`Subdomain ${subdomain} created for server ${serverId}`);
      return record;
    } catch (error) {
      this.logger.error(`Failed to create subdomain: ${error}`);
      throw error;
    }
  }

  /**
   * Update subdomain IP address
   */
  async updateSubdomainIp(subdomainId: string, newIpAddress: string) {
    try {
      const subdomain = await (this.prisma as any).serverSubdomain.findUnique({
        where: { id: subdomainId },
      });

      if (!subdomain) {
        throw new Error('Subdomain not found');
      }

      // Update DNS record on CloudFlare
      if (subdomain.dnsRecordId) {
        await this.updateDnsRecord(subdomain.dnsRecordId, newIpAddress);
      }

      // Update database
      const updated = await (this.prisma as any).serverSubdomain.update({
        where: { id: subdomainId },
        data: {
          ipAddress: newIpAddress,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Subdomain ${subdomain.subdomain} IP updated to ${newIpAddress}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update subdomain IP: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a subdomain
   */
  async deleteSubdomain(subdomainId: string) {
    try {
      const subdomain = await (this.prisma as any).serverSubdomain.findUnique({
        where: { id: subdomainId },
      });

      if (!subdomain) {
        throw new Error('Subdomain not found');
      }

      // Delete DNS record from CloudFlare
      if (subdomain.dnsRecordId) {
        await this.deleteDnsRecord(subdomain.dnsRecordId);
      }

      // Delete database entry
      await (this.prisma as any).serverSubdomain.delete({
        where: { id: subdomainId },
      });

      this.logger.log(`Subdomain ${subdomain.subdomain} deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete subdomain: ${error}`);
      throw error;
    }
  }

  /**
   * Get all subdomains for a server
   */
  async getServerSubdomains(serverId: string) {
    return (this.prisma as any).serverSubdomain.findMany({
      where: { serverId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific subdomain by ID
   */
  async getSubdomainById(subdomainId: string) {
    return (this.prisma as any).serverSubdomain.findUnique({
      where: { id: subdomainId },
      include: { server: true },
    });
  }

  /**
   * Get a subdomain by name
   */
  async getSubdomainByName(subdomain: string) {
    return (this.prisma as any).serverSubdomain.findUnique({
      where: { subdomain },
      include: { server: true },
    });
  }

  /**
   * List all subdomains (admin view)
   */
  async listAllSubdomains(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [subdomains, total] = await Promise.all([
      (this.prisma as any).serverSubdomain.findMany({
        include: { server: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (this.prisma as any).serverSubdomain.count(),
    ]);

    return {
      data: subdomains,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Validate subdomain format (alphanumeric and hyphens only)
   */
  private isValidSubdomain(subdomain: string): boolean {
    const regex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;
    return (
      regex.test(subdomain) &&
      subdomain.length >= 3 &&
      subdomain.length <= 63 &&
      !subdomain.startsWith('-') &&
      !subdomain.endsWith('-')
    );
  }

  /**
   * Create DNS A record on CloudFlare
   */
  private async createDnsRecord(
    subdomain: string,
    ipAddress: string,
  ): Promise<string> {
    if (!this.cloudflareApiToken || !this.cloudflareZoneId) {
      this.logger.warn('CloudFlare credentials not configured, skipping DNS record creation');
      return '';
    }

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.cloudflareZoneId}/dns_records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.cloudflareApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'A',
            name: `${subdomain}.${this.primaryDomain}`,
            content: ipAddress,
            ttl: 3600,
            proxied: false,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`CloudFlare API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result.id;
    } catch (error) {
      this.logger.error(`Failed to create CloudFlare DNS record: ${error}`);
      throw error;
    }
  }

  /**
   * Update DNS A record on CloudFlare
   */
  private async updateDnsRecord(
    recordId: string,
    ipAddress: string,
  ): Promise<void> {
    if (!this.cloudflareApiToken || !this.cloudflareZoneId) {
      return;
    }

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.cloudflareZoneId}/dns_records/${recordId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.cloudflareApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'A',
            content: ipAddress,
            ttl: 3600,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`CloudFlare API error: ${response.statusText}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update CloudFlare DNS record: ${error}`);
      throw error;
    }
  }

  /**
   * Delete DNS record from CloudFlare
   */
  private async deleteDnsRecord(recordId: string): Promise<void> {
    if (!this.cloudflareApiToken || !this.cloudflareZoneId) {
      return;
    }

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.cloudflareZoneId}/dns_records/${recordId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.cloudflareApiToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`CloudFlare API error: ${response.statusText}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete CloudFlare DNS record: ${error}`);
      throw error;
    }
  }

  /**
   * Check DNS propagation status
   */
  async checkDnsPropagation(subdomain: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://dns.google/resolve?name=${subdomain}.${this.primaryDomain}&type=A`,
      );

      const data = await response.json();
      return data.Answer && data.Answer.length > 0;
    } catch (error) {
      this.logger.error(`Failed to check DNS propagation: ${error}`);
      return false;
    }
  }

  /**
   * Bulk create subdomains for a server cluster
   */
  async bulkCreateSubdomains(
    serverId: string,
    subdomains: { subdomain: string; ipAddress: string }[],
  ) {
    const results = [];

    for (const sub of subdomains) {
      try {
        const created = await this.createSubdomain(
          serverId,
          sub.subdomain,
          sub.ipAddress,
        );
        results.push({ success: true, subdomain: created });
      } catch (error) {
        results.push({ success: false, subdomain: sub.subdomain, error });
      }
    }

    return results;
  }
}
