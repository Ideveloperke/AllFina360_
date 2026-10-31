import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AUTH, type Auth } from './auth/auth';
import { ENV, type Env } from './config/env';

async function bootstrap() {
  // Body parsing is disabled so Better Auth can read the raw request first.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  const env = app.get<Env>(ENV);
  const auth = app.get<Auth>(AUTH);

  app.use(helmet());
  app.enableCors({ origin: env.WEB_URL, credentials: true });

  // Better Auth owns /api/auth/* (sign-up, sign-in, sessions).
  app.getHttpAdapter().getInstance().all('/api/auth/{*any}', toNodeHandler(auth));

  // Everything else gets JSON parsing. Pasted transcripts can be large.
  app.use(express.json({ limit: '5mb' }));
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  await app.listen(env.API_PORT);
  Logger.log(`AllFina API listening on http://localhost:${env.API_PORT}/api`, 'Bootstrap');
}

void bootstrap();
