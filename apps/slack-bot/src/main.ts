import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

const logger = new Logger('SlackBotBootstrap');

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.flushLogs();

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
