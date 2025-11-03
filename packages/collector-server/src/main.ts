import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MikroORM } from '@mikro-orm/core';
import { AppModule } from './app.module';
import { COLLECTOR_CONFIG, CollectorServerConfig } from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get<CollectorServerConfig>(COLLECTOR_CONFIG);
  const orm = app.get<MikroORM>(MikroORM);
  await orm.getSchemaGenerator().updateSchema();
  await app.listen(config.port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Collector server listening on port ${config.port}`);
}

void bootstrap();
