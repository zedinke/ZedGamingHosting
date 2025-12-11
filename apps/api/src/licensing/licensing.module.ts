import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LicensingService } from './licensing.service';
import { LicensingController } from './licensing.controller';

/**
 * Licensing Module - KRITIKUS!
 * Validates license on startup and enforces node limits
 * If license is invalid, application will NOT start (fail-closed)
 */
@Module({
  imports: [ScheduleModule],
  providers: [LicensingService],
  controllers: [LicensingController],
  exports: [LicensingService],
})
export class LicensingModule implements OnModuleInit {
  private readonly logger = new Logger(LicensingModule.name);

  constructor(private readonly licensingService: LicensingService) {}

  /**
   * Validate license on module initialization
   * If validation fails, application will exit
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Validating license...');

    const result = await this.licensingService.validateLicense();

    if (!result.valid) {
      this.logger.error('License validation failed', {
        status: result.status,
        reason: result.reason,
      });

      // Fail-closed: application MUST NOT start without valid license
      this.logger.fatal('Application cannot start without valid license. Exiting...');
      process.exit(1);
    }

    this.logger.log('License validation successful', {
      status: result.status,
      maxNodes: result.maxNodesAllowed,
      validUntil: result.validUntil,
    });
  }
}

