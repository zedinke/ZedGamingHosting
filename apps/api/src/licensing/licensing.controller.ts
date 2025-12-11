import { Controller, Get } from '@nestjs/common';
import { LicensingService } from './licensing.service';

/**
 * Licensing Controller - provides license status endpoint
 */
@Controller('licensing')
export class LicensingController {
  constructor(private readonly licensingService: LicensingService) {}

  /**
   * Health check endpoint for license
   * GET /api/licensing/health
   */
  @Get('health')
  async checkLicenseHealth() {
    const license = await this.licensingService.getCurrentLicense();

    const daysUntilExpiry = license.validUntil
      ? Math.floor((license.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      status: license.valid ? 'HEALTHY' : 'UNHEALTHY',
      licenseStatus: license.status,
      validUntil: license.validUntil?.toISOString(),
      daysUntilExpiry,
      maxNodesAllowed: license.maxNodesAllowed,
      whitelabelEnabled: license.whitelabelEnabled,
    };
  }
}

