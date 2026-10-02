import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { HEADER_SALAO_ID } from '@salonflow/shared';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';
import { registrarErrosFatais } from './shared/erros-fatais.js';
import { GlobalExceptionFilter } from './shared/http/exception.filter.js';

registrarErrosFatais();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', HEADER_SALAO_ID],
  });
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableShutdownHooks();

  await app.listen(config.get('PORT', { infer: true }), '0.0.0.0');
}
await bootstrap();
