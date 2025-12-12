import { Module } from '@nestjs/common';
import { PortManagerService } from './port-manager.service';

/**
 * Networking Module - handles port allocation and network management
 */
@Module({
  providers: [PortManagerService],
  exports: [PortManagerService],
})
export class NetworkingModule {}


