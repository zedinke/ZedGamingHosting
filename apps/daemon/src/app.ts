import { ContainerManager } from './container/container-manager';
import { TaskProcessor } from './task/task-processor';
import { MetricsCollector } from './metrics/metrics-collector';
import { HealthChecker } from './health/health-checker';
import { HeartbeatClient } from './heartbeat/heartbeat-client';
import { StartupGuard } from './startup/startup-guard';
import { ReconciliationService } from './reconciliation/reconciliation.service';
import { BackendClient } from './backend/backend-client';
import * as http from 'http';

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

  private reconciliationService: ReconciliationService;
  private backendClient: BackendClient;
  private redisConnection: IORedis | null = null;
  private httpServer: http.Server | null = null;

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

    // Initialize Redis connection for update queue
    this.redisConnection = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: null,
    });

    // Initialize update queue service
    this.updateQueueService = new UpdateQueueService(this.redisConnection);
  }

  /**
   * Initializes all components
   */
  async initialize(): Promise<void> {
    console.log('Initializing ZedDaemon...');
    await this.containerManager.initialize();
    
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
   * Starts HTTP server for health checks
   */
  startHttpServer(): void {
    const port = parseInt(process.env.DAEMON_PORT || '3001');
    this.httpServer = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    this.httpServer.listen(port, '0.0.0.0', () => {
      console.log(`✅ HTTP server listening on port ${port}`);
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
}

