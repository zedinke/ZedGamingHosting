import Docker from 'dockerode';
import * as fs from 'fs/promises';

/**
 * Container Manager - handles Docker container lifecycle
 * All operations are idempotent
 */
export class ContainerManager {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  /**
   * Initializes container manager
   */
  async initialize(): Promise<void> {
    try {
      await this.docker.ping();
      console.log('✅ Docker connection established');
    } catch (error) {
      throw new Error(`Failed to connect to Docker: ${error}`);
    }
  }

  /**
   * Creates a container (idempotent)
   * If container already exists, returns existing container
   */
  async createContainer(config: {
    serverUuid: string;
    image: string;
    gameType: string;
    resources: {
      cpuLimit: number;
      ramLimit: number;
    };
    envVars: Record<string, string>;
    ports: Array<{ port: number; protocol: string }>;
    volumes: Array<{ source: string; target: string }>;
  }): Promise<Docker.Container> {
    const containerName = `zedhosting-${config.serverUuid}`;

    // Check if container already exists (idempotency)
    try {
      const existing = this.docker.getContainer(containerName);
      await existing.inspect();
      console.log(`Container ${containerName} already exists`);
      return existing;
    } catch {
      // Container doesn't exist, create it
    }

    // Log configuration (prevents log bombs)
    const logConfig = {
      Type: 'json-file',
      Config: {
        'max-size': '10m',
        'max-file': '3',
        compress: 'true',
      },
    };

    // Pull image if not present
    try {
      await this.docker.getImage(config.image).inspect();
      console.log(`Image ${config.image} already present`);
    } catch {
      console.log(`Pulling image: ${config.image}`);
      await new Promise<void>((resolve, reject) => {
        this.docker.pull(config.image, (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) return reject(err);
          
          this.docker.modem.followProgress(stream, (err: Error | null) => {
            if (err) return reject(err);
            console.log(`✅ Image pulled: ${config.image}`);
            resolve();
          });
        });
      });
    }

    // Create container
    const container = await this.docker.createContainer({
      Image: config.image,
      name: containerName,
      Labels: {
        'com.zedhosting.managed': 'true',
        'com.zedhosting.serverUuid': config.serverUuid,
        'com.zedhosting.gameType': config.gameType,
      },
      HostConfig: {
        LogConfig: logConfig,
        Memory: config.resources.ramLimit * 1024 * 1024, // MB to bytes
        CpuShares: config.resources.cpuLimit * 1024,
        PortBindings: this.createPortBindings(config.ports),
        Binds: config.volumes.map((v) => `${v.source}:${v.target}`),
        RestartPolicy: { Name: 'unless-stopped' },
      },
      Env: Object.entries(config.envVars).map(([key, value]) => `${key}=${value}`),
      User: '1000:1000', // PUID/PGID - never run as root
    });

    console.log(`✅ Container created: ${containerName}`);
    return container;
  }

  /**
   * Starts a container (idempotent)
   */
  async startContainer(serverUuid: string): Promise<void> {
    const container = this.docker.getContainer(`zedhosting-${serverUuid}`);
    const info = await container.inspect();

    if (info.State.Running) {
      console.log(`Container zedhosting-${serverUuid} already running`);
      return;
    }

    await container.start();
    console.log(`✅ Container started: zedhosting-${serverUuid}`);
  }

  /**
   * Stops a container (idempotent)
   */
  async stopContainer(serverUuid: string): Promise<void> {
    const container = this.docker.getContainer(`zedhosting-${serverUuid}`);
    const info = await container.inspect();

    if (!info.State.Running) {
      console.log(`Container zedhosting-${serverUuid} already stopped`);
      return;
    }

    await container.stop({ t: 30 }); // 30 second grace period
    console.log(`✅ Container stopped: zedhosting-${serverUuid}`);
  }

  /**
   * Restarts a container
   */
  async restartContainer(serverUuid: string): Promise<void> {
    const container = this.docker.getContainer(`zedhosting-${serverUuid}`);
    await container.restart({ t: 30 });
    console.log(`✅ Container restarted: zedhosting-${serverUuid}`);
  }

  /**
   * Deletes a container and optionally cleans up volumes
   */
  async deleteContainer(serverUuid: string, volumes: Array<{ source: string; target: string }> = []): Promise<void> {
    const containerName = `zedhosting-${serverUuid}`;
    const container = this.docker.getContainer(containerName);

    try {
      // 1. Stop container if running
      const info = await container.inspect();
      if (info.State.Running) {
        console.log(`Stopping container ${containerName} before deletion...`);
        await container.stop({ t: 10 });
      }
    } catch (error: any) {
      // Container might not exist, continue
      if (error.statusCode !== 404) {
        console.error(`Error stopping container ${containerName}:`, error);
      }
    }

    try {
      // 2. Remove container
      await container.remove({ v: false }); // Don't remove volumes yet
      console.log(`✅ Container removed: ${containerName}`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.log(`Container ${containerName} does not exist, skipping removal`);
      } else {
        throw error;
      }
    }

    // 3. Clean up volumes (host directories)
    for (const volume of volumes) {
      try {
        const volumePath = volume.source;
        console.log(`Cleaning up volume: ${volumePath}`);
        
        // Check if directory exists
        try {
          await fs.access(volumePath);
          // Remove directory recursively
          await fs.rm(volumePath, { recursive: true, force: true });
          console.log(`✅ Volume removed: ${volumePath}`);
        } catch (error: any) {
          if (error.code === 'ENOENT') {
            console.log(`Volume ${volumePath} does not exist, skipping cleanup`);
          } else {
            console.error(`Error removing volume ${volumePath}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error cleaning up volume ${volume.source}:`, error);
        // Continue with other volumes
      }
    }
  }

  /**
   * Gets all managed containers
   */
  async getManagedContainers(): Promise<Docker.ContainerInfo[]> {
    const containers = await this.docker.listContainers({ all: true });
    return containers.filter((c) => c.Labels['com.zedhosting.managed'] === 'true');
  }

  /**
   * Creates port bindings for Docker
   */
  private createPortBindings(ports: Array<{ port: number; protocol: string }>): Record<string, any[]> {
    const bindings: Record<string, any[]> = {};

    for (const portConfig of ports) {
      const key = `${portConfig.port}/${portConfig.protocol.toLowerCase()}`;
      bindings[key] = [{ HostPort: portConfig.port.toString() }];
    }

    return bindings;
  }

  /**
   * Updates container resources (CPU/RAM) and optionally restarts to apply changes.
   * Env vars cannot be changed via Docker update; requires recreate. Here we only log env intent.
   */
  async updateContainer(config: {
    serverUuid: string;
    resources?: { cpuLimit?: number; ramLimit?: number };
    envVars?: Record<string, string>;
    restart?: boolean;
  }): Promise<void> {
    const containerName = `zedhosting-${config.serverUuid}`;
    const container = this.docker.getContainer(containerName);

    let info;
    try {
      info = await container.inspect();
    } catch (error: any) {
      if (error?.statusCode === 404) {
        throw new Error(`Container ${containerName} not found for update`);
      }
      throw error;
    }

    // Apply resource updates if provided
    if (config.resources) {
      const updatePayload: any = {};
      if (config.resources.ramLimit !== undefined) {
        updatePayload.Memory = config.resources.ramLimit * 1024 * 1024; // MB -> bytes
      }
      if (config.resources.cpuLimit !== undefined) {
        updatePayload.CpuShares = config.resources.cpuLimit * 1024;
      }

      if (Object.keys(updatePayload).length > 0) {
        await container.update(updatePayload);
        console.log(`Updated container resources for ${containerName}`, updatePayload);
      }
    }

    // Env var changes require recreate; log intent for visibility.
    if (config.envVars) {
      console.log(`Env vars update requested for ${containerName} (requires recreate). Skipping in-place.`);
    }

    if (config.restart) {
      await container.restart({ t: 30 });
      console.log(`✅ Container restarted after update: ${containerName}`);
    }
  }

  /**
   * Executes a shell command inside the container.
   */
  async execInContainer(serverUuid: string, command: string): Promise<{ output: string }> {
    const containerName = `zedhosting-${serverUuid}`;
    const container = this.docker.getContainer(containerName);

    try {
      await container.inspect();
    } catch (error: any) {
      if (error?.statusCode === 404) {
        throw new Error(`Container ${containerName} not found for exec`);
      }
      throw error;
    }

    const exec = await container.exec({
      Cmd: ['/bin/sh', '-c', command],
      AttachStdout: true,
      AttachStderr: true,
    });

    return await new Promise((resolve, reject) => {
      exec.start((err, stream) => {
        if (err) return reject(err);

        let output = '';
        stream.on('data', (chunk: Buffer) => {
          output += chunk.toString();
        });
        stream.on('end', () => resolve({ output }));
        stream.on('error', reject);
      });
    });
  }
}
