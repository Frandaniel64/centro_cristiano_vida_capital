import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configurarApp } from './app.setup.js';
import { config } from './config.js';

async function bootstrap() {
  const app = configurarApp(await NestFactory.create<NestExpressApplication>(AppModule));
  app.enableShutdownHooks();
  await app.listen(config.puerto);
}
await bootstrap();
