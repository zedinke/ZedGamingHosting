import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

type Locale = 'hu' | 'en';

interface Messages {
  [key: string]: string | Messages;
}

/**
 * i18n Service - handles message translation
 * Default language: HU
 * NO hardcoded strings allowed - all messages must use i18n keys
 */
@Injectable()
export class I18nService {
  private readonly defaultLocale: Locale = 'hu';
  private messages: Map<Locale, Messages> = new Map();

  constructor() {
    this.loadMessages('hu');
    this.loadMessages('en');
  }

  /**
   * Loads messages from JSON file
   */
  private loadMessages(locale: Locale): void {
    try {
      // Try different paths for development and production
      const possiblePaths = [
        path.join(__dirname, 'locales', locale, 'messages.json'), // Production (compiled)
        path.join(__dirname, '..', 'i18n', 'locales', locale, 'messages.json'), // Alternative path
        path.join(process.cwd(), 'apps', 'api', 'src', 'i18n', 'locales', locale, 'messages.json'), // Development
        path.join(process.cwd(), 'dist', 'apps', 'api', 'src', 'i18n', 'locales', locale, 'messages.json'), // Compiled
      ];

      let content: string | null = null;
      for (const filePath of possiblePaths) {
        try {
          if (fs.existsSync(filePath)) {
            content = fs.readFileSync(filePath, 'utf-8');
            break;
          }
        } catch {
          // Continue to next path
        }
      }

      if (content) {
        this.messages.set(locale, JSON.parse(content));
      } else {
        console.warn(`Failed to load messages for locale: ${locale} - file not found in any expected location`);
        this.messages.set(locale, {});
      }
    } catch (error) {
      console.warn(`Failed to load messages for locale: ${locale}`, error);
      this.messages.set(locale, {});
    }
  }

  /**
   * Translates a message key (alias for translate method)
   */
  t(key: string, params?: Record<string, string>, locale?: Locale): string {
    return this.translate(key, locale || this.defaultLocale, params);
  }

  /**
   * Translates a message key
   * @param key - i18n key (e.g., "SERVER_STARTED_SUCCESSFULLY")
   * @param locale - Language code (default: HU)
   * @param params - Optional parameters for message interpolation
   * @returns Translated message or key if not found
   */
  translate(key: string, locale: Locale = this.defaultLocale, params?: Record<string, string>): string {
    const messages = this.messages.get(locale) || this.messages.get(this.defaultLocale) || {};
    let message = this.getNestedValue(messages, key);

    if (!message) {
      // Fallback to default locale
      const defaultMessages = this.messages.get(this.defaultLocale) || {};
      message = this.getNestedValue(defaultMessages, key);
    }

    if (!message) {
      // If still not found, return key (should not happen in production)
      console.warn(`Missing translation key: ${key} for locale: ${locale}`);
      return key;
    }

    // Replace parameters
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        message = message.replace(`{${paramKey}}`, paramValue);
      }
    }

    return message;
  }

  /**
   * Gets nested value from object using dot notation
   */
  private getNestedValue(obj: Messages, path: string): string | undefined {
    const keys = path.split('.');
    let value: Messages | string | undefined = obj;

    for (const key of keys) {
      if (typeof value === 'object' && value !== null && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Parses Accept-Language header and returns preferred locale
   */
  parseLocale(acceptLanguage?: string): Locale {
    if (!acceptLanguage) {
      return this.defaultLocale;
    }

    // Simple parsing - takes first language
    const languages = acceptLanguage.split(',').map((lang) => lang.split(';')[0].trim().toLowerCase());

    if (languages.includes('hu')) {
      return 'hu';
    }
    if (languages.includes('en')) {
      return 'en';
    }

    return this.defaultLocale;
  }
}


