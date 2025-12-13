import { ContainerManager } from './container/container-manager';
import { TaskProcessor } from './task/task-processor';
import { MetricsCollector } from './metrics/metrics-collector';
import { HealthChecker } from './health/health-checker';
import { HeartbeatClient } from './heartbeat/heartbeat-client';
import { StartupGuard } from './startup/startup-guard';
import { ReconciliationService } from './reconciliation/reconciliation.service';
import { BackendClient } from './backend/backend-client';
import { UpdateQueueService } from './update/update-queue.service';
import { CacheManager } from './cache/cache-manager.service';
import { NFSManager } from './nfs/nfs-manager.service';
import { BackupService } from './backup/backup.service';
import { FileService } from './files/file-service';
import IORedis from 'ioredis';
import * as http from 'http';
import * as url from 'url';

/**
 * ZedDaemon - The Brain
 * Main application class that orchestrates all daemon components
 */
export class ZedDaemon {
  private containerManager: ContainerManager;
  private taskProcessor: TaskProcessor;
  private metricsCollector: MetricsCollector;
  private healthChecker: HealthChecker;
  private heartbeatClient: HeartbeatClient;
  private updateQueueService: UpdateQueueService | null = null;
  private cacheManager: CacheManager;
  private nfsManager: NFSManager;
  private backupService: BackupService;

  private reconciliationService: ReconciliationService;
  private backendClient: BackendClient;
  private redisConnection: IORedis | null = null;
  private httpServer: http.Server | null = null;
  private fileService: FileService;

  constructor() {
    this.backendClient = new BackendClient();
    this.containerManager = new ContainerManager();
    this.taskProcessor = new TaskProcessor(this.backendClient, this.containerManager);
    this.metricsCollector = new MetricsCollector(this.backendClient);
    this.healthChecker = new HealthChecker(this.containerManager, this.backendClient);
    this.heartbeatClient = new HeartbeatClient(this.backendClient);
    new StartupGuard(this.containerManager);
    this.reconciliationService = new ReconciliationService(
      this.containerManager,
      this.backendClient
    );

    // Initialize cache manager
    this.cacheManager = new CacheManager();

    // Initialize NFS manager
    this.nfsManager = new NFSManager();

    // Initialize backup service
    this.backupService = new BackupService();

    // Initialize file service
    this.fileService = new FileService();

    // Initialize Redis connection for update queue
    this.redisConnection = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: null,
    });

    // Initialize update queue service with cache manager
    this.updateQueueService = new UpdateQueueService(this.redisConnection, this.cacheManager);
  }

  /**
   * Initializes all components
   */
  async initialize(): Promise<void> {
    console.log('Initializing ZedDaemon...');
    await this.containerManager.initialize();
    
    // Initialize cache manager
    await this.cacheManager.initialize();
    console.log('✅ Cache manager initialized');

    // Initialize NFS manager
    await this.nfsManager.initialize();
    console.log('✅ NFS manager initialized');

    // Initialize backup service
    await this.backupService.initialize();
    console.log('✅ Backup service initialized');
    
    // Verify Redis connection
    if (this.redisConnection) {
      try {
        await this.redisConnection.ping();
        console.log('✅ Redis connection established');
      } catch (error) {
        console.warn('⚠️ Redis connection failed, update queue will not work:', error);
      }
    }
    
    console.log('✅ ZedDaemon initialized');
  }

  /**
   * Registers daemon with backend
   */
  async register(): Promise<void> {
    console.log('Registering with backend...');
    await this.backendClient.register();
    console.log('✅ Registered with backend');
  }

  /**
   * Performs startup reconciliation
   */
  async startupReconciliation(): Promise<void> {
    console.log('Starting reconciliation...');
    await this.reconciliationService.reconcile();
    console.log('✅ Reconciliation complete');
  }

  /**
   * Starts periodic tasks
   */
  startPeriodicTasks(): void {
    console.log('Starting periodic tasks...');
    this.metricsCollector.start();
    this.healthChecker.start();
    this.heartbeatClient.start();
    console.log('✅ Periodic tasks started');
  }

  /**
   * Starts HTTP server for health checks and file operations
   */
  startHttpServer(): void {
    const port = parseInt(process.env.DAEMON_PORT || '3001');
    this.httpServer = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url || '', true);
      const pathname = parsedUrl.pathname;
      
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      try {
        // Health check
        if (pathname === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
          return;
        }

        // File operations
        if (pathname?.startsWith('/api/files/')) {
          await this.handleFileRequest(req, res, pathname);
          return;
        }

        // Not found
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });

    this.httpServer.listen(port, '0.0.0.0', () => {
      console.log(`✅ HTTP server listening on port ${port}`);
    });
  }

  /**
   * Handles file operation requests
   */
  private async handleFileRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    pathname: string,
  ): Promise<void> {
    const parts = pathname.split('/').filter((p) => p);
    // parts: ['api', 'files', 'server', serverUuid, ...]

    if (parts.length < 4 || parts[2] !== 'server') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid request path' }));
      return;
    }

    const serverUuid = parts[3];
    const operation = parts[4] || 'list';

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        let result: any;

        switch (operation) {
          case 'list': {
            const query = new URL(req.url || '', 'http://localhost').searchParams;
            const path = query.get('path') || '/';
            const files = await this.fileService.listFiles(serverUuid, path);
            result = { path, files };
            break;
          }

          case 'content': {
            const query = new URL(req.url || '', 'http://localhost').searchParams;
            const path = query.get('path');
            if (!path) {
              throw new Error('Path parameter required');
            }
            const content = await this.fileService.getFileContent(serverUuid, path);
            result = { path, content, encoding: 'utf-8' };
            break;
          }

          case 'write': {
            const data = JSON.parse(body || '{}');
            if (!data.path || data.content === undefined) {
              throw new Error('Path and content required');
            }
            await this.fileService.writeFileContent(serverUuid, data.path, data.content);
            result = { success: true, path: data.path, message: 'File saved successfully' };
            break;
          }

          case 'create': {
            const data = JSON.parse(body || '{}');
            if (!data.path || !data.type) {
              throw new Error('Path and type required');
            }
            await this.fileService.createFile(serverUuid, data.path, data.type);
            result = {
              success: true,
              path: data.path,
              type: data.type,
              message: `${data.type === 'file' ? 'File' : 'Directory'} created successfully`,
            };
            break;
          }

          case 'delete': {
            const query = new URL(req.url || '', 'http://localhost').searchParams;
            const path = query.get('path');
            if (!path) {
              throw new Error('Path parameter required');
            }
            await this.fileService.deleteFile(serverUuid, path);
            result = { success: true, path, message: 'File deleted successfully' };
            break;
          }

          default:
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unknown operation' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
      }
    });
  }

  /**
   * Starts task processing loop
   */
  startTaskProcessing(): void {
    console.log('Starting task processing...');
    this.taskProcessor.start();
    console.log('✅ Task processing started');
  }

  /**
   * Gets the update queue service
   */
  getUpdateQueueService(): UpdateQueueService | null {
    return this.updateQueueService;
  }

  /**
   * Gets the cache manager
   */
  getCacheManager(): CacheManager {
    return this.cacheManager;
  }

  /**
   * Gets the NFS manager
   */
  getNfsManager(): NFSManager {
    return this.nfsManager;
  }

  /**
   * Gets the backup service
   */
  getBackupService(): BackupService {
    return this.backupService;
  }
}

