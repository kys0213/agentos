import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { App, ExpressReceiver } from '@slack/bolt';
import type { Request, Response } from 'express';

import {
  SLACK_HANDLER_METADATA_KEY,
  SLACK_PARAM_METADATA_KEY,
  type SlackBindingMetadata,
  type SlackParamMetadataEntry,
  buildSlackParameterArray,
} from './slack.decorators';

@Injectable()
export class SlackBoltService implements OnModuleInit {
  private readonly logger = new Logger(SlackBoltService.name);
  private receiver?: ExpressReceiver;
  private app?: App;

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector
  ) {}

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

    this.registerDiscoveredHandlers(this.app);
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

  private registerDiscoveredHandlers(app: App): void {
    const providers = this.discoveryService.getProviders();

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') {
        continue;
      }

      const prototype = Object.getPrototypeOf(instance);
      if (!prototype) {
        continue;
      }

      this.metadataScanner.scanFromPrototype(instance, prototype, (methodName: string) => {
        const handlerRef = instance[methodName as keyof typeof instance];
        if (typeof handlerRef !== 'function') {
          return;
        }

        const binding = this.reflector.get<SlackBindingMetadata | undefined>(
          SLACK_HANDLER_METADATA_KEY,
          handlerRef
        );

        if (!binding) {
          return;
        }

        const parameterMetadata = (
          this.reflector.get<SlackParamMetadataEntry[] | undefined>(
            SLACK_PARAM_METADATA_KEY,
            handlerRef
          ) ?? []
        )
          .slice()
          .sort((left, right) => left.index - right.index);

        const boundHandler = (...boltArgs: unknown[]) => {
          const params = buildSlackParameterArray(parameterMetadata, handlerRef.length, boltArgs);
          return handlerRef.apply(instance, params);
        };

        if (binding.type === 'event') {
          app.event(
            binding.matcher as Parameters<App['event']>[0],
            boundHandler as Parameters<App['event']>[1]
          );
          return;
        }

        if (binding.type === 'command') {
          app.command(
            binding.matcher as Parameters<App['command']>[0],
            boundHandler as Parameters<App['command']>[1]
          );
          return;
        }

        app.action(
          binding.matcher as Parameters<App['action']>[0],
          boundHandler as Parameters<App['action']>[1]
        );
      });
    }
  }
}
