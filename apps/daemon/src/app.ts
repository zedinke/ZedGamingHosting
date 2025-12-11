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

  private reconciliationService: ReconciliationService;
  private backendClient: BackendClient;
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
  }

  /**
   * Initializes all components
   */
  async initialize(): Promise<void> {
    console.log('Initializing ZedDaemon...');
    await this.containerManager.initialize();
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
}

