import { z } from 'zod';

/**
 * Environment variable validation schema
 * All environment variables must be validated using Zod schemas
 * This ensures type safety and prevents runtime errors
 */

export const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.coerce.number().int().positive().default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().nonnegative().default(0),

  // Licensing
   LICENSE_SERVER_URL: z.string().url().optional(),
   LICENSE_KEY: z.string().uuid().optional(),
   LICENSE_PUBLIC_KEY: z.string().optional(),
  LICENSE_VALIDATION_CACHE_TTL: z.coerce.number().int().positive().default(86400),
  LICENSE_GRACE_PERIOD_HOURS: z.coerce.number().int().positive().default(72),
  LICENSE_REVALIDATION_INTERVAL: z.coerce.number().int().positive().default(21600),

  // API
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_HOST: z.string().default('0.0.0.0'),
  API_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Daemon
  DAEMON_PORT: z.coerce.number().int().positive().default(3001),
   MANAGER_URL: z.string().url().optional(),
   API_KEY: z.string().min(32).optional(),
   NODE_ID: z.string().uuid().optional(),
  METRICS_INTERVAL: z.coerce.number().int().positive().default(15000),
  HEARTBEAT_INTERVAL: z.coerce.number().int().positive().default(30000),
  TASK_POLL_INTERVAL: z.coerce.number().int().positive().default(5000),
  HEALTH_CHECK_INTERVAL: z.coerce.number().int().positive().default(30000),
  STARTUP_DELAY: z.coerce.number().int().positive().default(5000),

  // Networking
  PORT_RANGE_START: z.coerce.number().int().positive().default(20000),
  PORT_RANGE_END: z.coerce.number().int().positive().default(30000),
  PORT_ALLOCATION_STRATEGY: z.enum(['CONTIGUOUS', 'RANDOM']).default('CONTIGUOUS'),

  // Cloudflare
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  DEFAULT_DOMAIN: z.string().default('zedgaminghosting.hu'),

  // Traefik
  TRAEFIK_IMAGE: z.string().default('traefik:v2.10'),
  TRAEFIK_DASHBOARD_PORT: z.coerce.number().int().positive().default(8080),
  TRAEFIK_ACME_EMAIL: z.string().email(),
  TRAEFIK_ACME_STORAGE: z.string().default('/etc/traefik/acme.json'),
  TRAEFIK_DYNAMIC_CONFIG_PATH: z.string().default('/etc/traefik/dynamic.yml'),

  // Steam Cache
  MAX_CONCURRENT_UPDATES: z.coerce.number().int().positive().default(2),
  CACHE_BASE_PATH: z.string().default('/var/lib/zedhosting/steam_cache'),
  CACHE_MAX_AGE_DAYS: z.coerce.number().int().positive().default(30),
  CACHE_CLEANUP_ENABLED: z.coerce.boolean().default(true),
  STEAMCMD_PATH: z.string().default('/opt/steamcmd/steamcmd.sh'),

  // Backup
  BACKUP_TYPE: z.enum(['sftp', 's3', 'local']).default('sftp'),
  BACKUP_SFTP_HOST: z.string().optional(),
  BACKUP_SFTP_USER: z.string().optional(),
  BACKUP_SFTP_PATH: z.string().default('/backups'),
  BACKUP_S3_BUCKET: z.string().optional(),
  BACKUP_S3_REGION: z.string().default('eu-central-1'),
  BACKUP_LOCAL_PATH: z.string().default('/var/lib/zedhosting/backups'),
  BACKUP_PASSWORD_FILE: z.string().default('/etc/restic/password'),
  BACKUP_RETENTION_DAILY: z.coerce.number().int().positive().default(7),
  BACKUP_RETENTION_WEEKLY: z.coerce.number().int().positive().default(4),
  BACKUP_RETENTION_MONTHLY: z.coerce.number().int().positive().default(12),

  // NFS
  NFS_SERVER_PACKAGE: z.string().default('nfs-kernel-server'),
  NFS_CLIENT_PACKAGE: z.string().default('nfs-common'),
  CLUSTER_MOUNT_BASE: z.string().default('/var/lib/zedhosting/clusters'),
  NFS_EXPORT_FILE: z.string().default('/etc/exports'),
  NFS_FSTAB_FILE: z.string().default('/etc/fstab'),
  NFS_HEALTH_CHECK_INTERVAL: z.coerce.number().int().positive().default(300000),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Discord
  DISCORD_WEBHOOK_URL: z.string().url().optional(),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns typed environment object
 * Throws error if validation fails
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\nPlease check your .env file.`
      );
    }
    throw error;
  }
}


