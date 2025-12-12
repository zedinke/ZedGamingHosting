import { Module } from '@nestjs/common';
import { SubdomainsController } from './subdomains.controller';
import { SubdomainsService } from './subdomains.service';
import { CloudflareClient } from './cloudflare-client.service';
import { TraefikManager } from './traefik-manager.service';
import { DatabaseModule } from '../database/database.module';
import { I18nModule } from '../i18n/i18n.module';

@Module({
  imports: [DatabaseModule, I18nModule],
  controllers: [SubdomainsController],
  providers: [SubdomainsService, CloudflareClient, TraefikManager],
  exports: [SubdomainsService],
})
export class SubdomainsModule {}

