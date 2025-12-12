import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
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
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  // API prefix
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.API_PORT || 3000;
  const host = process.env.API_HOST || '0.0.0.0';

  await app.listen(port, host);
  Logger.log(`🚀 Application is running on: http://${host}:${port}/${globalPrefix}`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to start application', error);
  process.exit(1);
});


