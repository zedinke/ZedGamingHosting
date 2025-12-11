import Docker from 'dockerode';

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
    const inspect = await container.inspect();

    if (inspect.State.Running) {
      console.log(`Container ${serverUuid} is already running`);
      return;
    }

    await container.start();
    console.log(`✅ Container started: ${serverUuid}`);
  }

  /**
   * Stops a container (idempotent)
   */
  async stopContainer(serverUuid: string): Promise<void> {
    const container = this.docker.getContainer(`zedhosting-${serverUuid}`);
    const inspect = await container.inspect();

    if (!inspect.State.Running) {
      console.log(`Container ${serverUuid} is already stopped`);
      return;
    }

    await container.stop({ t: 30 }); // 30 second timeout
    console.log(`✅ Container stopped: ${serverUuid}`);
  }

  /**
   * Restarts a container
   */
  async restartContainer(serverUuid: string): Promise<void> {
    const container = this.docker.getContainer(`zedhosting-${serverUuid}`);
    await container.restart({ t: 30 });
    console.log(`✅ Container restarted: ${serverUuid}`);
  }

  /**
   * Gets all managed containers
   */
  async getManagedContainers(): Promise<Docker.ContainerInfo[]> {
    const containers = await this.docker.listContainers({ all: true });
    return containers.filter((c) => c.Labels?.['com.zedhosting.managed'] === 'true');
  }

  /**
   * Creates port bindings for Docker
   */
  private createPortBindings(ports: Array<{ port: number; protocol: string }>): Record<string, unknown> {
    const bindings: Record<string, unknown> = {};

    for (const port of ports) {
      const key = `${port.port}/${port.protocol.toLowerCase()}`;
      bindings[key] = [{ HostPort: port.port.toString() }];
    }

    return bindings;
  }
}

