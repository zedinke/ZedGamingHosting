
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@zed-hosting/db';
import { Node } from '../../../../libs/db/src';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Provisioning Service
 * Automates node setup using Ansible
 */
@Injectable()
export class ProvisioningService {
    private readonly logger = new Logger(ProvisioningService.name);


    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generates Ansible inventory for a specific node
     */
    async generateInventory(nodeId: string): Promise<string> {
        const node = await this.prisma.node.findUnique({
            where: { id: nodeId },
        });

        if (!node) {
            throw new Error(`Node not found: ${nodeId}`);
        }

        // Generate INI format inventory
        const inventory = `
[nodes]
${node.ipAddress} ansible_user=root ansible_ssh_private_key_file=${process.env.SSH_KEY_PATH || '~/.ssh/id_rsa'}

[nodes:vars]
node_id=${node.id}
api_key=${node.apiKey}
manager_url=${process.env.MANAGER_URL || 'http://localhost:3000'}
provisioning_token=${await this.getProvisioningToken(node)}
`;

        return inventory;
    }

    /**
     * Gets or generates a provisioning token for the node
     * In a real implementation, this would be a separate field or logic
     * For now, we mock it or reuse apiKey if appropriate, but spec says separate token
     */
    private async getProvisioningToken(node: Node): Promise<string> {
        // In a real app, we might store this in Redis with TTL
        // For MVP, we generate a temporary token logic or just return a placeholder
        // verified by the register endpoint
        return 'temp-provisioning-token-' + node.id;
    }

    /**
     * Runs Ansible playbook to provision the node
     */
    async provisionNode(nodeId: string) {
        this.logger.log(`Starting provisioning for node ${nodeId}...`);

        try {
            // 1. Generate inventory file
            const inventoryContent = await this.generateInventory(nodeId);
            const inventoryPath = path.join('/tmp', `inventory-${nodeId}.ini`);
            await fs.writeFile(inventoryPath, inventoryContent);

            // 2. Define playbook path (assumed to be in repo or specific location)
            const playbookPath = path.resolve(__dirname, '../../../../scripts/ansible/provision-node.yml');

            // 3. Run ansible-playbook
            // Note: This requires ansible to be installed in the environment where API runs
            const command = `ansible-playbook -i ${inventoryPath} ${playbookPath}`;

            this.logger.log(`Executing: ${command}`);

            // In a real env, we might use a job queue (BullMQ) for this long-running task
            // For MVP, we await it (careful with timeouts!) or fire-and-forget
            const { stdout, stderr } = await execAsync(command);

            this.logger.log('Provisioning completed successfully');
            this.logger.debug(stdout);

            if (stderr) {
                this.logger.warn(`Ansible stderr: ${stderr}`);
            }

            return { success: true, details: stdout };

        } catch (error) {
            this.logger.error(`Provisioning failed for node ${nodeId}`, error);
            throw new InternalServerErrorException({
                message: 'Provisioning failed',
                details: (error as Error).message
            });
        }
    }
}
