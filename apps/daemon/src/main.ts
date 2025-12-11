import { validateEnv } from '@zed-hosting/utils';
import { ZedDaemon } from './app';

/**
 * Bootstrap the Daemon application
 * Validates environment variables before starting
 */
async function main(): Promise<void> {
  // Validate environment variables
  try {
    validateEnv();
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }

  const daemon = new ZedDaemon();

  try {
    // Initialize daemon
    await daemon.initialize();

    // Register with backend
    await daemon.register();

    // Startup reconciliation
    await daemon.startupReconciliation();

    // Start periodic tasks
    daemon.startPeriodicTasks();

    // Start HTTP server (for health checks)
    daemon.startHttpServer();

    // Start task processing loop
    daemon.startTaskProcessing();

    console.log('✅ ZedDaemon started successfully');
  } catch (error) {
    console.error('Failed to start daemon:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

