import { Injectable } from '@nestjs/common';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

export interface SubdomainRouteConfig {
  subdomain: string;
  serverUuid: string;
  nodeId: string;
  containerName: string;
  httpPort: number;
}

export interface UpdateRouteConfig {
  oldSubdomain: string;
  newSubdomain: string;
  serverUuid: string;
  nodeId: string;
}

/**
 * TraefikManager - Manages Traefik dynamic configuration
 * Updates dynamic.yml file to add/remove/update subdomain routes
 */
@Injectable()
export class TraefikManager {
  private readonly dynamicConfigPath: string;

  constructor() {
    // On the server, this will be the mounted volume path
    this.dynamicConfigPath = process.env.TRAEFIK_DYNAMIC_CONFIG_PATH || '/etc/traefik/dynamic.yml';
  }

  /**
   * Adds a subdomain route to Traefik configuration
   */
  async addSubdomainRoute(config: SubdomainRouteConfig): Promise<void> {
    const dynamicConfig = await this.loadDynamicConfig();

    const routerName = `subdomain-${config.serverUuid}`;
    const serviceName = `subdomain-service-${config.serverUuid}`;

    // Add HTTP router (redirects to HTTPS)
    if (!dynamicConfig.http.routers) {
      dynamicConfig.http.routers = {};
    }

    dynamicConfig.http.routers[`${routerName}-http`] = {
      rule: `Host(\`${config.subdomain}\`)`,
      entryPoints: ['web'],
      service: serviceName,
      middlewares: ['redirect-to-https'],
    };

    // Add HTTPS router
    dynamicConfig.http.routers[routerName] = {
      rule: `Host(\`${config.subdomain}\`)`,
      entryPoints: ['websecure'],
      service: serviceName,
      tls: {
        certResolver: 'letsencrypt',
      },
      priority: 100, // Higher priority than default routes
    };

    // Add service
    if (!dynamicConfig.http.services) {
      dynamicConfig.http.services = {};
    }

    // Get node IP or use container name
    const serviceUrl = await this.getServiceUrl(config.nodeId, config.containerName, config.httpPort);

    dynamicConfig.http.services[serviceName] = {
      loadBalancer: {
        servers: [
          {
            url: serviceUrl,
          },
        ],
      },
    };

    await this.saveDynamicConfig(dynamicConfig);
    console.log(`[TraefikManager] Added route for subdomain: ${config.subdomain}`);
  }

  /**
   * Updates a subdomain route
   */
  async updateSubdomainRoute(config: UpdateRouteConfig): Promise<void> {
    const dynamicConfig = await this.loadDynamicConfig();
    const routerName = `subdomain-${config.serverUuid}`;

    // Update router rules
    if (dynamicConfig.http.routers && dynamicConfig.http.routers[`${routerName}-http`]) {
      dynamicConfig.http.routers[`${routerName}-http`].rule = `Host(\`${config.newSubdomain}\`)`;
    }

    if (dynamicConfig.http.routers && dynamicConfig.http.routers[routerName]) {
      dynamicConfig.http.routers[routerName].rule = `Host(\`${config.newSubdomain}\`)`;
    }

    await this.saveDynamicConfig(dynamicConfig);
    console.log(`[TraefikManager] Updated route: ${config.oldSubdomain} -> ${config.newSubdomain}`);
  }

  /**
   * Removes a subdomain route from Traefik configuration
   */
  async removeSubdomainRoute(config: {
    subdomain: string;
    serverUuid: string;
    nodeId: string;
  }): Promise<void> {
    const dynamicConfig = await this.loadDynamicConfig();
    const routerName = `subdomain-${config.serverUuid}`;
    const serviceName = `subdomain-service-${config.serverUuid}`;

    // Remove routers
    if (dynamicConfig.http.routers) {
      delete dynamicConfig.http.routers[`${routerName}-http`];
      delete dynamicConfig.http.routers[routerName];
    }

    // Remove service
    if (dynamicConfig.http.services) {
      delete dynamicConfig.http.services[serviceName];
    }

    await this.saveDynamicConfig(dynamicConfig);
    console.log(`[TraefikManager] Removed route for subdomain: ${config.subdomain}`);
  }

  /**
   * Gets service URL for a container
   * In Docker network, uses container name. Otherwise, uses node IP.
   */
  private async getServiceUrl(_nodeId: string, containerName: string, httpPort: number): Promise<string> {
    // If Traefik is in the same Docker network, use container name
    // Otherwise, we'd need to get node IP from database
    // For now, assume same network
    return `http://${containerName}:${httpPort}`;
  }

  /**
   * Loads dynamic configuration from file
   */
  private async loadDynamicConfig(): Promise<any> {
    try {
      if (fs.existsSync(this.dynamicConfigPath)) {
        const content = await fs.promises.readFile(this.dynamicConfigPath, 'utf-8');
        const config: any = yaml.load(content) || { http: {} };
        
        // Ensure http structure exists
        if (!config.http) {
          config.http = {};
        }
        if (!config.http.routers) {
          config.http.routers = {};
        }
        if (!config.http.services) {
          config.http.services = {};
        }
        if (!config.http.middlewares) {
          config.http.middlewares = {};
        }
        if (!config.http.middlewares['redirect-to-https']) {
          config.http.middlewares['redirect-to-https'] = {
            redirectScheme: {
              scheme: 'https',
              permanent: true,
            },
          };
        }
        
        return config;
      }
    } catch (error) {
      console.error(`[TraefikManager] Failed to load dynamic config: ${error}`);
    }

    // Return default structure
    return {
      http: {
        routers: {},
        services: {},
        middlewares: {
          'redirect-to-https': {
            redirectScheme: {
              scheme: 'https',
              permanent: true,
            },
          },
        },
      },
    };
  }

  /**
   * Saves dynamic configuration to file
   */
  private async saveDynamicConfig(config: any): Promise<void> {
    try {
      // Ensure http structure is properly initialized
      if (!config.http) {
        config.http = {};
      }
      if (!config.http.routers) {
        config.http.routers = {};
      }
      if (!config.http.services) {
        config.http.services = {};
      }
      if (!config.http.middlewares) {
        config.http.middlewares = {};
      }

      const yamlContent = yaml.dump(config, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        quotingType: '"',
        forceQuotes: false,
      });

      // Ensure directory exists
      const dir = path.dirname(this.dynamicConfigPath);
      await fs.promises.mkdir(dir, { recursive: true });

      await fs.promises.writeFile(this.dynamicConfigPath, yamlContent, 'utf-8');
      console.log(`[TraefikManager] Saved dynamic config to ${this.dynamicConfigPath}`);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[TraefikManager] Failed to save dynamic config: ${errorMessage}`);
      throw new Error(`Failed to save Traefik config: ${errorMessage}`);
    }
  }
}

