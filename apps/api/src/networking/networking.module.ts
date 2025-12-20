import { Module } from '@nestjs/common';
import { PortManagerService } from './port-manager.service';
import { SubdomainService } from './subdomain.service';
import { SubdomainController } from './subdomain.controller';

/**
 * Networking Module - handles port allocation, network management, and subdomain management
 */
@Module({
  providers: [PortManagerService, SubdomainService],
  controllers: [SubdomainController],
  exports: [PortManagerService, SubdomainService],
})
export class NetworkingModule {}


