import { Module } from '@nestjs/common';
import { NodesService } from './nodes.service';
import { NodesController } from './nodes.controller';
import { LicensingService } from '../licensing/licensing.service';
import { NetworkingModule } from '../networking/networking.module';

/**
 * Nodes Module - handles node registration and management
 */
@Module({
  imports: [NetworkingModule],
  providers: [NodesService, LicensingService],
  controllers: [NodesController],
  exports: [NodesService],
})
export class NodesModule {}

