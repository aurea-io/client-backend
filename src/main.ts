import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('ClientBootstrap');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const clientFrontendUrl = process.env.CLIENT_FRONTEND_URL || 'http://localhost:5175';

  app.enableCors({
    origin: [
      clientFrontendUrl,
      'http://localhost:5175',
      'http://localhost:5174',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3003;
  await app.listen(port);
  logger.log(`🚀 AUREA Client API running on http://localhost:${port}/api`);
}

bootstrap();
