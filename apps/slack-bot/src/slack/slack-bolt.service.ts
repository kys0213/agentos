import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { App, ExpressReceiver } from '@slack/bolt';

interface MiddlewareCapableAdapter {
  use: (path: string, handler: unknown) => void;
}

@Injectable()
export class SlackBoltService implements OnModuleInit {
  private readonly logger = new Logger(SlackBoltService.name);
  private receiver?: ExpressReceiver;
  private app?: App;

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  get boltApp(): App | undefined {
    return this.app;
  }

  get expressReceiver(): ExpressReceiver | undefined {
    return this.receiver;
  }

  onModuleInit(): void {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    const botToken = process.env.SLACK_BOT_TOKEN;

    if (!signingSecret || !botToken) {
      this.logger.warn(
        'SlackBoltService 초기화를 건너뜁니다. SLACK_SIGNING_SECRET 또는 SLACK_BOT_TOKEN 환경 변수가 누락되었습니다.'
      );
      return;
    }

    this.receiver = new ExpressReceiver({ signingSecret });
    this.app = new App({
      token: botToken,
      receiver: this.receiver,
    });

    const httpAdapter = this.httpAdapterHost.httpAdapter as MiddlewareCapableAdapter | undefined;

    if (!httpAdapter?.use) {
      this.logger.warn(
        '현재 HTTP 어댑터에서 Express 미들웨어 등록을 지원하지 않아 Slack 이벤트 라우터를 연결하지 못했습니다.'
      );
      return;
    }

    httpAdapter.use('/slack/events', this.receiver.router);
    this.logger.log('Slack Bolt ExpressReceiver가 /slack/events 경로에 마운트되었습니다.');
  }
}
