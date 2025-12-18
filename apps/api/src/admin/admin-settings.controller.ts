import { Controller, Get, Put, Body, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

/**
 * Admin Settings Controller
 * Manage platform settings (ADMIN ONLY)
 */
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSettingsController {
  private readonly logger = new Logger(AdminSettingsController.name);

  /**
   * Get all platform settings (ADMIN ONLY)
   */
  @Get()
  async getSettings() {
    try {
      this.logger.log('Admin fetched platform settings');
      return {
        maxPlayersPerServer: 128,
        maxServersPerUser: 10,
        minBillingAmount: 100,
        paymentProcessingFee: 3,
        refundWindowDays: 30,
        emailTemplatesEnabled: true,
        maintenanceMode: false,
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch settings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update platform settings (ADMIN ONLY)
   */
  @Put()
  async updateSettings(@Body() updateData: Record<string, any>) {
    try {
      const allowedSettings = [
        'MAX_PLAYERS_PER_SERVER',
        'MAX_SERVERS_PER_USER',
        'MIN_BILLING_AMOUNT',
        'PAYMENT_PROCESSING_FEE',
        'REFUND_WINDOW_DAYS',
        'EMAIL_TEMPLATES_ENABLED',
        'MAINTENANCE_MODE',
      ];

      const updates: string[] = [];
      for (const key of Object.keys(updateData)) {
        if (allowedSettings.includes(key.toUpperCase())) {
          updates.push(key);
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid settings to update');
      }

      this.logger.log(`Admin updated ${updates.length} settings`);

      // Return current settings (in production, would persist to database)
      return this.getSettings();
    } catch (error: any) {
      this.logger.error(`Failed to update settings: ${error.message}`);
      throw error;
    }
  }
}

