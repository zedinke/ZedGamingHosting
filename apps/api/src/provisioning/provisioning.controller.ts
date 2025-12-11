
import { Controller, Post, Param } from '@nestjs/common';
import { ProvisioningService } from './provisioning.service';

/**
 * Provisioning Controller
 * Endpoints to trigger provisioning manually
 */
@Controller('provisioning')
export class ProvisioningController {
    constructor(private readonly provisioningService: ProvisioningService) { }

    /**
     * Triggers provisioning for a node
     * POST /api/provisioning/:nodeId
     */
    @Post(':nodeId')
    async provisionNode(@Param('nodeId') nodeId: string) {
        return await this.provisioningService.provisionNode(nodeId);
    }
}
