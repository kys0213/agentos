import 'reflect-metadata';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SLACK_HANDLER_METADATA_KEY,
  SLACK_PARAM_METADATA_KEY,
  SlackAck,
  SlackAction,
  SlackActionPayload,
  SlackBody,
  SlackClient,
  SlackCommand,
  SlackCommandPayload,
  SlackContext,
  SlackEvent,
  SlackEventPayload,
  SlackParamMetadataEntry,
  SlackRespond,
  buildSlackParameterArray,
  resolveSlackParamValue,
} from '../slack/slack.decorators';

describe('Slack decorators', () => {
  it('메서드 데코레이터가 Slack 핸들러 메타데이터를 설정한다', () => {
    class Example {
      @SlackEvent('message')
      handleEvent(): void {}

      @SlackCommand('/agent')
      handleCommand(): void {}

      @SlackAction('interactive-action')
      handleAction(): void {}
    }

    const eventMetadata = Reflect.getMetadata(
      SLACK_HANDLER_METADATA_KEY,
      Example.prototype.handleEvent
    );
    const commandMetadata = Reflect.getMetadata(
      SLACK_HANDLER_METADATA_KEY,
      Example.prototype.handleCommand
    );
    const actionMetadata = Reflect.getMetadata(
      SLACK_HANDLER_METADATA_KEY,
      Example.prototype.handleAction
    );

    expect(eventMetadata).toEqual({ type: 'event', matcher: 'message' });
    expect(commandMetadata).toEqual({ type: 'command', matcher: '/agent' });
    expect(actionMetadata).toEqual({ type: 'action', matcher: 'interactive-action' });
  });

  it('파라미터 데코레이터가 메타데이터를 누적한다', () => {
    class Example {
      handler(
        @SlackEventPayload('text') text: string,
        @SlackCommandPayload('channel_id') channelId: string,
        @SlackAck() ack: () => Promise<void>,
        @SlackRespond() respond: (message: unknown) => Promise<void>,
        @SlackActionPayload('payload.id') actionId: string,
        @SlackBody('team.id') teamId: string,
        @SlackClient('chat.postMessage') postMessage: unknown,
        @SlackContext('userId') userId: string
      ): void {
        void this;
        void text;
        void channelId;
        void ack;
        void respond;
        void actionId;
        void teamId;
        void postMessage;
        void userId;
      }
    }

    const metadata = Reflect.getMetadata(
      SLACK_PARAM_METADATA_KEY,
      Example.prototype.handler
    ) as SlackParamMetadataEntry[];

    expect(metadata).toContainEqual({ index: 0, source: 'event', path: 'text' });
    expect(metadata).toContainEqual({ index: 1, source: 'command', path: 'channel_id' });
    expect(metadata).toContainEqual({ index: 2, source: 'ack', path: undefined });
    expect(metadata).toContainEqual({ index: 3, source: 'respond', path: undefined });
    expect(metadata).toContainEqual({ index: 4, source: 'action', path: 'payload.id' });
    expect(metadata).toContainEqual({ index: 5, source: 'body', path: 'team.id' });
    expect(metadata).toContainEqual({ index: 6, source: 'client', path: 'chat.postMessage' });
    expect(metadata).toContainEqual({ index: 7, source: 'context', path: 'userId' });
  });
});

describe('resolveSlackParamValue', () => {
  interface SlackHandlerInvocationContext {
    event?: { text: string; user: string };
    command?: { channel_id: string; text: string };
    action?: { type: string };
    payload?: { view: { state: { values: { field: { value: string } } } } };
    body?: { team: { id: string } };
    context?: { teamId: string; userId: string };
    client?: { chat: { postMessage: () => Promise<void> | void } };
    ack?: unknown;
    respond?: unknown;
    say?: unknown;
  }

  type SlackHandlerArguments = [SlackHandlerInvocationContext, ...unknown[]];

  const createHandlerArgs = (
    overrides: Partial<SlackHandlerInvocationContext> = {}
  ): SlackHandlerArguments => [
    {
      event: { text: 'hello', user: 'U123' },
      command: { channel_id: 'C456', text: 'command text' },
      action: { type: 'view_submission' },
      payload: { view: { state: { values: { field: { value: 'input' } } } } },
      body: { team: { id: 'T789' } },
      context: { teamId: 'T789', userId: 'U123' },
      client: { chat: { postMessage: vi.fn() } },
      ack: vi.fn(),
      respond: vi.fn(),
      say: vi.fn(),
      ...overrides,
    },
  ];

  let handlerArgs: SlackHandlerArguments;
  let ack: ReturnType<typeof vi.fn>;
  let respond: ReturnType<typeof vi.fn>;
  let say: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ack = vi.fn();
    respond = vi.fn();
    say = vi.fn();
    handlerArgs = createHandlerArgs({ ack, respond, say });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('이벤트, 커맨드, 액션 소스에서 값을 추출한다', () => {
    // When & Then
    expect(resolveSlackParamValue('event', handlerArgs, 'user')).toBe('U123');
    expect(resolveSlackParamValue('command', handlerArgs, 'channel_id')).toBe('C456');
    expect(resolveSlackParamValue('action', handlerArgs, 'type')).toBe('view_submission');
  });

  it('payload/body/context/client 경로를 추출한다', () => {
    // When
    const payloadValue = resolveSlackParamValue(
      'payload',
      handlerArgs,
      'view.state.values.field.value'
    );
    const bodyValue = resolveSlackParamValue('body', handlerArgs, 'team.id');
    const contextValue = resolveSlackParamValue('context', handlerArgs, 'teamId');
    const clientValue = resolveSlackParamValue('client', handlerArgs, 'chat.postMessage');

    // Then
    expect(payloadValue).toBe('input');
    expect(bodyValue).toBe('T789');
    expect(contextValue).toBe('T789');
    expect(clientValue).toBe(handlerArgs[0]?.client?.chat.postMessage);
  });

  it('ack/respond/say는 함수일 때만 반환한다', () => {
    // Then
    expect(resolveSlackParamValue('ack', handlerArgs)).toBe(ack);
    expect(resolveSlackParamValue('respond', handlerArgs)).toBe(respond);
    expect(resolveSlackParamValue('say', handlerArgs)).toBe(say);

    // Given
    const invalidArgs: SlackHandlerArguments = [
      { ack: 'not-fn', respond: null, say: undefined },
    ];

    // Then
    expect(resolveSlackParamValue('ack', invalidArgs)).toBeUndefined();
    expect(resolveSlackParamValue('respond', invalidArgs)).toBeUndefined();
    expect(resolveSlackParamValue('say', invalidArgs)).toBeUndefined();
  });
});

describe('buildSlackParameterArray', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('메타데이터가 없으면 원본 인수를 반환한다', () => {
    const args = [{}, vi.fn()];

    const result = buildSlackParameterArray([], 2, args);

    expect(result).toBe(args);
  });

  it('메타데이터를 기반으로 파라미터 배열을 생성한다', () => {
    const ack = vi.fn();
    const args = [
      {
        event: { text: 'hello' },
        ack,
      },
      'unused',
    ];
    const metadata: SlackParamMetadataEntry[] = [
      { index: 0, source: 'event', path: 'text' },
      { index: 1, source: 'ack' },
    ];

    const params = buildSlackParameterArray(metadata, 2, args);

    expect(params).toEqual(['hello', ack]);
  });

  it('파라미터 개수가 메서드 길이보다 적어도 누락된 위치를 보존한다', () => {
    const args = [
      {
        event: { text: 'value' },
      },
    ];
    const metadata: SlackParamMetadataEntry[] = [{ index: 2, source: 'event', path: 'text' }];

    const params = buildSlackParameterArray(metadata, 1, args);

    expect(params).toEqual([undefined, undefined, 'value']);
  });
});
