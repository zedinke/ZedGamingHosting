import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { validateEnv } from '@zed-hosting/utils';

/**
 * Bootstrap the NestJS application
 * Validates environment variables before starting
 */
async function bootstrap(): Promise<void> {
  // Validate environment variables
  try {
    validateEnv();
  } catch (error) {
    Logger.error('Environment validation failed', error);
    process.exit(1);
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV === 'development',
    })
  );

  // Biztonsági fejlécek Fastify/Helmet
  await app.register(helmet, {
    contentSecurityPolicy: false, // frontend Next saját CSP-je felülírhatja
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });


  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // CORS
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'https://zedgaminghosting.hu',
    'https://www.zedgaminghosting.hu',
    'http://localhost:3001',
    'http://localhost:3000',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // API prefix (exclude /metrics for Prometheus)
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['/metrics'],
  });

  const port = process.env.API_PORT || 3000;
  const host = process.env.API_HOST || '0.0.0.0';

   Logger.log(`Attempting to listen on ${host}:${port}...`);
  await app.listen(port, host);
  Logger.log(`🚀 Application is running on: http://${host}:${port}/${globalPrefix}`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to start application', error);
   console.error('Bootstrap error details:', error);
  process.exit(1);
});


