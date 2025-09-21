import 'reflect-metadata';

import { Logger, type RawBodyRequest } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Request, Response, NextFunction } from 'express';
import express from 'express';

import { AppModule } from './app.module';

const logger = new Logger('SlackBotBootstrap');

function assignRawBody(req: RawBodyRequest<Request>, _res: Response, buffer: Buffer): void {
  if (buffer?.length) {
    req.rawBody = buffer;
  }
}

function isSlackEventsRequest(req: Request): boolean {
  return req.path.startsWith('/slack/events');
}

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  app.flushLogs();

  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() === 'express') {
    const instance = httpAdapter.getInstance();

    const rawSlackMiddleware = express.raw({ type: '*/*' });
    instance.use(
      '/slack/events',
      rawSlackMiddleware,
      (req: RawBodyRequest<Request>, _res: Response, next: NextFunction) => {
        if (req.body instanceof Buffer) {
          req.rawBody = req.body;
        }
        next();
      }
    );

    const jsonParser = express.json({ verify: assignRawBody });
    const urlEncodedParser = express.urlencoded({ extended: true, verify: assignRawBody });

    instance.use((req: Request, res: Response, next: NextFunction) => {
      if (isSlackEventsRequest(req)) {
        next();
        return;
      }
      jsonParser(req, res, next);
    });

    instance.use((req: Request, res: Response, next: NextFunction) => {
      if (isSlackEventsRequest(req)) {
        next();
        return;
      }
      urlEncodedParser(req, res, next);
    });
  }

  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);
  logger.log(`Slack Bot 서버가 포트 ${port}에서 대기 중입니다.`);
}

if (require.main === module) {
  bootstrap().catch((error) => {
    logger.error('Slack Bot 서버 부트스트랩에 실패했습니다.', error);
    process.exitCode = 1;
  });
}
