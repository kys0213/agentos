import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { App, ExpressReceiver } from '@slack/bolt';
import type { Request, Response } from 'express';

@Injectable()
export class SlackBoltService implements OnModuleInit {
  private readonly logger = new Logger(SlackBoltService.name);
  private receiver?: ExpressReceiver;
  private app?: App;

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
    this.logger.log('Slack Bolt ExpressReceiver가 초기화되었습니다.');
  }

  async dispatch(req: Request, res: Response): Promise<void> {
    const receiver = this.receiver;

    if (!receiver) {
      res.status(503).send('Slack Bolt 앱이 초기화되지 않았습니다.');
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        receiver.router(req, res, (error?: unknown) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });

      if (!res.headersSent) {
        res.status(404).send();
      }
    } catch (error) {
      const report = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Slack Bolt 요청 처리 중 오류가 발생했습니다.', report);

      if (!res.headersSent) {
        res.status(500).send('Slack 요청 처리에 실패했습니다.');
      }
    }
  }
}
