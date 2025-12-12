import { Module, Global } from '@nestjs/common';
import { I18nService } from './i18n.service';

/**
 * i18n Module - provides internationalization support
 * Default language: HU (Hungarian)
 * Supported languages: HU, EN
 */
@Global()
@Module({
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule {}


