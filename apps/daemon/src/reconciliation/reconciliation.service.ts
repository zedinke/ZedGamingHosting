import { ContainerManager } from '../container/container-manager';
import { BackendClient } from '../backend/backend-client';

/**
 * Reconciliation Service - performs startup reconciliation
 * Compares Docker state with database state and fixes discrepancies
 */
export class ReconciliationService {
  constructor(
    private readonly containerManager: ContainerManager,
    private readonly backendClient: BackendClient
  ) {}

  /**
   * Performs reconciliation
   */
  async reconcile(): Promise<void> {
    console.log('Starting reconciliation...');

    // 1. Get actual state from Docker
    const actualContainers = await this.containerManager.getManagedContainers();
    const actualState = new Map(
      actualContainers.map((c) => [
        c.Names[0]?.replace('/', '') || '',
        c.State === 'running' ? 'RUNNING' : 'STOPPED',
      ])
    );

    // 2. Get expected state from backend
    const expectedServers = await this.backendClient.getExpectedServers();
    const expectedState = new Map(
      (expectedServers as Array<{ uuid: string; status: string }>).map((s) => [s.uuid, s.status])
    );

    // 3. Compare and reconcile
    const reconciliationActions: Array<{ type: string; serverUuid: string; reason: string }> = [];

    // Servers that should be running but are not
    for (const [uuid, expectedStatus] of expectedState.entries()) {
      if (expectedStatus === 'RUNNING') {
        const containerName = `zedhosting-${uuid}`;
        const actualStatus = actualState.get(containerName);
        if (actualStatus !== 'RUNNING') {
          reconciliationActions.push({
            type: 'START',
            serverUuid: uuid,
            reason: `Expected RUNNING but actual state is ${actualStatus || 'not found'}`,
          });
        }
      }
    }

    // Servers that are running but shouldn't be (orphaned)
    for (const [containerName, actualStatus] of actualState.entries()) {
      if (actualStatus === 'RUNNING') {
        const uuid = containerName.replace('zedhosting-', '');
        const expectedStatus = expectedState.get(uuid);
        if (!expectedStatus || expectedStatus !== 'RUNNING') {
          reconciliationActions.push({
            type: 'ADOPT_OR_STOP',
            serverUuid: uuid,
            reason: 'Container running but not in expected state',
          });
        }
      }
    }

    // 4. Execute reconciliation actions
    for (const action of reconciliationActions) {
      try {
        await this.executeReconciliationAction(action);
      } catch (error) {
        console.error(`Reconciliation action failed: ${action.type}`, error);
      }
    }

    console.log(`✅ Reconciliation complete. Actions: ${reconciliationActions.length}`);
  }

  /**
   * Executes a reconciliation action
   */
  private async executeReconciliationAction(action: {
    type: string;
    serverUuid: string;
    reason: string;
  }): Promise<void> {
    console.log(`Executing reconciliation: ${action.type} for ${action.serverUuid} - ${action.reason}`);

    switch (action.type) {
      case 'START':
        await this.containerManager.startContainer(action.serverUuid);
        break;
      case 'ADOPT_OR_STOP':
        // For now, just stop orphaned containers
        // In production, could adopt them
        await this.containerManager.stopContainer(action.serverUuid);
        break;
    }
  }
}

