# Slack Bot Server Plan

## Requirements

### 성공 조건

- [ ] core 패키지의 `Agent`, `AgentSession`, `CoreContent`를 활용해 **에이전트 실행 파이프라인**을 구성한다.
- [ ] Slack/Discord 등 커넥터는 `ChatConnector` 제네릭 인터페이스만 구현하면 동일한 에이전트를 재사용할 수 있다.
- [ ] 채널별로 n개의 에이전트를 등록하고 오케스트레이션 에이전트가 메시지 흐름을 제어한다.
- [ ] 채널마다 새로운 에이전트를 **동적으로 생성**하여 등록할 수 있다.
- [ ] LRU+TTL 기반 `AgentCache`로 자주 사용되는 에이전트만 메모리에 유지한다.
- [ ] 메시지와 응답에는 파일이나 이미지 등 `CoreContent[]` 형태의 첨부가 포함될 수 있다.
- [ ] `AgentEventBridge`를 사용하여 에이전트와 세션 이벤트를 내부 이벤트 버스로 전달하고 Slack/Discord로 라우팅한다.
- [ ] NestJS 기반 모듈 구조로 커넥터, 에이전트 실행기, 채널 설정 관리가 분리된다.
- [ ] Bolt `App`을 NestJS 라이프사이클에 맞춰 DiscoveryService와 Slack 전용 컨트롤러에 주입하고, HTTP 어댑터 내부 구현에 직접 의존하지 않으면서도 `@All('/slack/events')` 라우트를 통해 Bolt 요청을 위임하는 초기 서버 구조를 제공한다.
- [ ] Bolt 이벤트/커맨드 핸들러는 `@nestjs/common`의 `SetMetadata`를 사용하는 TypeScript 메타데이터 데코레이터로 마킹한 NestJS 프로바이더를 DiscoveryService와 `Reflector`로 탐색하여 기존 데코레이터 메타데이터와 통합된 자동 바인딩을 제공한다.
- [ ] Slack Bolt 미들웨어 스펙(`event`, `command`, `action`, `payload`, `ack`, `respond`, `say`, `client`, `body`, `context`)을 파라미터 데코레이터로 선언해 Nest 프로바이더 메서드 시그니처에서 타입 안전하게 주입하고 자동 바인딩 시 메서드 파라미터 순서를 메타데이터로 재구성한다.
- [ ] 채널별 에이전트 설정을 제공하고 **활성화된 에이전트 목록**을 조회할 수 있다.
- [ ] MCP 도구·지식·메모리·프리셋·에이전트를 관리할 수 있는 API를 제공하되 모든 로직은 `@agentos/core`의 서비스와 레지스트리를 그대로 활용한다.
- [ ] 필요한 기능이 core에 없다면 먼저 core 패키지에 기능을 추가한 후 사용한다.
- [ ] Slack/Discord 커스텀 UX는 slash command 기반으로 제공된다.

### 사용 시나리오

- [ ] 개발자가 여러 에이전트를 등록하고 채널 A에는 요약 에이전트, 채널 B에는 번역 에이전트를 매핑한다.
- [ ] 채널 C에는 여러 에이전트를 동시에 등록하고, 오케스트레이션 에이전트가 메시지마다 적절한 에이전트를 선택한다.
- [ ] 관리자가 API를 호출해 채널 D에 새로운 요약 에이전트를 생성하고 즉시 사용할 수 있다.
- [ ] 사용자가 Slack에서 파일을 첨부해 메시지를 보내면 `attachments`를 통해 전달되고, 결과가 동일 채널로 전송된다.
- [ ] Discord 커넥터를 추가하더라도 서버 로직 수정 없이 동일한 도메인 모델과 에이전트를 재사용한다.
- [ ] 사용자는 `/agent add translator` 같은 slash command로 채널에 에이전트를 등록한다.
- [ ] 관리자는 Slack 커스텀 모달에서 채널별 에이전트 설정 및 MCP 도구·지식·메모리·프리셋을 구성한다.

### 제약 조건

- [ ] Node.js/TypeScript와 NestJS를 사용한다.
- [ ] 커넥터는 채널·사용자·메시지 등 공통 도메인 개념만 노출하고, 플랫폼별 확장은 제네릭 `meta`로 처리해 OCP를 지킨다.
- [ ] 외부 의존성은 최소화하고 오픈소스를 우선 사용한다.

## Interface Sketch

```typescript
import type {
  Agent,
  AgentSession,
  CoreContent,
  AgentService,
  AgentEventBridge,
  EventPublisher,
} from '@agentos/core';

// 메시지 이벤트
export interface ChatEvent<M = Record<string, unknown>> {
  channelId: string;
  userId: string;
  text: string;
  attachments?: CoreContent[];
  meta?: M;
}

// 슬래시 커맨드 이벤트
export interface CommandEvent<M = Record<string, unknown>> {
  channelId: string;
  userId: string;
  command: string; // e.g. /agent
  args: string[];
  meta?: M;
}

// 송신 메시지
export interface OutgoingMessage<M = Record<string, unknown>> {
  channelId: string;
  text: string;
  attachments?: CoreContent[];
  meta?: M;
}

// 커넥터
export interface ChatConnector<M> {
  onEvent(handler: (event: ChatEvent<M>) => Promise<void>): void;
  onCommand?(handler: (command: CommandEvent<M>) => Promise<void>): void;
  send(message: OutgoingMessage<M>): Promise<void>;
}

// 에이전트 생성 설정
export interface AgentConfig {
  agentId: string;
  // 모델, 시스템 프롬프트 등 구현체별 옵션
  options?: Record<string, unknown>;
}

// 채널별 에이전트 생성/설정 서비스
export interface ChannelAgentConfigService {
  createAgent(channelId: string, config: AgentConfig): Promise<Agent>;
}

// 에이전트 캐시 (LRU+TTL)
export class AgentCache {
  constructor(max: number, ttlMs: number) {}
  get(agentId: string): Agent | undefined;
  set(agentId: string, agent: Agent): void;
}

// 채널별 에이전트 매핑
export interface ChannelAgentRegistry {
  bindChannel(channelId: string, agentIds: string[]): void;
  getAgents(channelId: string): Promise<Agent[]>;
}

// 오케스트레이션 에이전트
export class OrchestratorAgent implements Agent {
  constructor(private agents: Agent[]) {}
  async chat(session: AgentSession, event: ChatEvent): Promise<CoreContent[]> {
    // 하위 에이전트 실행 순서 및 결과 조합
    return [];
  }
}

// Slack 커넥터 예시
export type SlackMeta = { ts: string; threadTs?: string };

export class SlackConnector implements ChatConnector<SlackMeta> {
  constructor(private client: SlackClient) {}
  onEvent(handler: (event: ChatEvent<SlackMeta>) => Promise<void>): void {
    // Slack 이벤트를 ChatEvent로 변환
  }
  async send(message: OutgoingMessage<SlackMeta>): Promise<void> {
    await this.client.chat.postMessage({
      channel: message.channelId,
      text: message.text,
      // attachments, meta 처리
    });
  }
}

// Bolt + NestJS 초기 구성
import { App, ExpressReceiver } from '@slack/bolt';
import type {
  SlackCommandMiddlewareArgs,
  SlackEventMiddlewareArgs,
  SlackActionMiddlewareArgs,
} from '@slack/bolt';
import {
  All,
  Controller,
  Injectable,
  Logger,
  Module,
  OnModuleInit,
  Req,
  Res,
  SetMetadata,
} from '@nestjs/common';
import {
  NestFactory,
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
  Reflector,
} from '@nestjs/core';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

const SLACK_HANDLER_METADATA_KEY = 'slack:handler';

type SlackHandlerType = 'event' | 'command' | 'action';

interface SlackBindingMetadata {
  type: SlackHandlerType;
  matcher: string; // e.g. event name, command name
}

// Nest의 SetMetadata를 사용해 기존 가드/인터셉터용 메타데이터 파이프라인과 통합
const createSlackDecorator =
  (type: SlackHandlerType) =>
  (matcher: string): MethodDecorator =>
    SetMetadata(SLACK_HANDLER_METADATA_KEY, {
      type,
      matcher,
    } satisfies SlackBindingMetadata);

export const SlackEvent = createSlackDecorator('event');
export const SlackCommand = createSlackDecorator('command');
export const SlackAction = createSlackDecorator('action');

const SLACK_PARAM_METADATA_KEY = 'slack:param';

type SlackParamSource =
  | 'event'
  | 'command'
  | 'action'
  | 'payload'
  | 'body'
  | 'context'
  | 'client'
  | 'ack'
  | 'respond'
  | 'say';

interface SlackParamMetadataEntry {
  index: number;
  source: SlackParamSource;
  path?: string;
}

const pluckValue = (target: unknown, path?: string) => {
  if (!path || typeof path !== 'string') {
    return target;
  }
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, target);
};

const pushSlackParamMetadata = (
  target: object,
  propertyKey: string | symbol,
  metadata: SlackParamMetadataEntry
) => {
  const descriptorTarget = (target as Record<string | symbol, unknown>)[propertyKey];
  if (typeof descriptorTarget !== 'function') {
    throw new Error('Slack 파라미터 데코레이터는 메서드에만 선언할 수 있습니다.');
  }
  const existing =
    (Reflect.getMetadata(SLACK_PARAM_METADATA_KEY, descriptorTarget) as
      | SlackParamMetadataEntry[]
      | undefined) ?? [];
  Reflect.defineMetadata(SLACK_PARAM_METADATA_KEY, [...existing, metadata], descriptorTarget);
};

const createSlackParamDecorator =
  (source: SlackParamSource) =>
  (path?: string): ParameterDecorator =>
  (target, propertyKey, parameterIndex) => {
    pushSlackParamMetadata(target, propertyKey, {
      index: parameterIndex,
      source,
      path,
    });
  };

export const SlackEventPayload = createSlackParamDecorator('event');
export const SlackCommandPayload = createSlackParamDecorator('command');
export const SlackActionPayload = createSlackParamDecorator('action');
export const SlackPayload = createSlackParamDecorator('payload');
export const SlackBody = createSlackParamDecorator('body');
export const SlackContext = createSlackParamDecorator('context');
export const SlackClient = createSlackParamDecorator('client');
export const SlackAck = createSlackParamDecorator('ack');
export const SlackRespond = createSlackParamDecorator('respond');
export const SlackSay = createSlackParamDecorator('say');

const resolveSlackParamValue = (source: SlackParamSource, args: unknown[], path?: string) => {
  const [middlewareArgs] = args as [Record<string, unknown>?];
  if (!middlewareArgs || typeof middlewareArgs !== 'object') {
    return undefined;
  }

  if (source === 'event' || source === 'command' || source === 'action') {
    return pluckValue(middlewareArgs[source], path);
  }

  if (source === 'payload') {
    return pluckValue(middlewareArgs.payload, path);
  }

  if (source === 'body' || source === 'context' || source === 'client') {
    return pluckValue(middlewareArgs[source], path);
  }

  if (source === 'ack' || source === 'respond' || source === 'say') {
    const value = middlewareArgs[source];
    return typeof value === 'function' ? value : undefined;
  }

  return undefined;
};

const buildSlackParameterArray = (
  metadata: SlackParamMetadataEntry[],
  methodLength: number,
  boltArgs: unknown[]
) => {
  if (!metadata.length) {
    return boltArgs;
  }

  const maxIndex = metadata.reduce((max, { index }) => Math.max(max, index), -1);
  const params = new Array(Math.max(methodLength, maxIndex + 1)).fill(undefined);

  for (const entry of metadata) {
    params[entry.index] = resolveSlackParamValue(entry.source, boltArgs, entry.path);
  }

  return params;
};

@Injectable()
export class SlackAgentHandlers {
  constructor(private readonly registry: ChannelAgentRegistry) {}

  @SlackEvent('message')
  async handleMessage(
    @SlackEventPayload() event: SlackEventMiddlewareArgs<'message'>['event'],
    @SlackClient() client: SlackEventMiddlewareArgs<'message'>['client'],
    @SlackContext('teamId') teamId?: string
  ) {
    const agents = await this.registry.getAgents(event.channel);
    // 메시지를 처리하고 응답 전송 로직 실행
    await client.chat.postMessage({
      channel: event.channel,
      text: `handled by ${agents.length} agents in team ${teamId ?? 'unknown'}`,
    });
  }

  @SlackCommand('/agent')
  async handleCommand(
    @SlackCommandPayload() command: SlackCommandMiddlewareArgs['command'],
    @SlackAck() ack: SlackCommandMiddlewareArgs['ack'],
    @SlackRespond() respond: SlackCommandMiddlewareArgs['respond']
  ) {
    await ack();
    await respond({
      text: `command received for ${command.channel_id}`,
    });
    // slash command 기반 채널 에이전트 등록/조회 처리
  }

  @SlackAction('agent-modal-submission')
  async handleModalSubmission(
    @SlackPayload('view.state.values')
    values: SlackActionMiddlewareArgs<'view_submission'>['payload']['view']['state']['values'],
    @SlackContext('teamId') teamId?: string,
    @SlackAck() ack: SlackActionMiddlewareArgs['ack']
  ) {
    await ack();
    // 모달 입력값을 기반으로 채널 설정을 갱신하고 teamId별 프리셋을 저장
  }
}

@Injectable()
export class SlackBoltService implements OnModuleInit {
  private readonly logger = new Logger(SlackBoltService.name);
  private readonly receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
  });
  readonly app = new App({
    token: process.env.SLACK_BOT_TOKEN!,
    receiver: this.receiver,
  });

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector
  ) {}

  async onModuleInit() {
    this.logger.log('Slack Bolt ExpressReceiver가 초기화되었습니다.');

    const providers = this.discovery.getProviders();
    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance) {
        continue;
      }

      // MetadataScanner + Reflector 조합으로 기존 Nest 데코레이터 메타데이터와 함께 탐색
      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        (methodName: string) => {
          const methodRef = instance[methodName as keyof typeof instance];
          if (typeof methodRef !== 'function') {
            return;
          }

          const binding = this.reflector.get<SlackBindingMetadata>(
            SLACK_HANDLER_METADATA_KEY,
            methodRef
          );
          if (!binding) {
            return;
          }

          const paramMetadata = (
            this.reflector.get<SlackParamMetadataEntry[]>(SLACK_PARAM_METADATA_KEY, methodRef) ?? []
          ).sort((a, b) => a.index - b.index);

          const handler = (...boltArgs: unknown[]) => {
            const params = buildSlackParameterArray(paramMetadata, methodRef.length, boltArgs);
            return methodRef.apply(instance, params);
          };

          if (binding.type === 'event') {
            this.app.event(binding.matcher, handler);
          }
          if (binding.type === 'command') {
            this.app.command(binding.matcher, handler);
          }
          if (binding.type === 'action') {
            this.app.action(binding.matcher, handler);
          }
        }
      );
    }
  }

  async dispatch(req: Request, res: Response): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.receiver.router(req, res, (error?: unknown) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    }).catch((error) => {
      this.logger.error('Slack Bolt 요청 처리 중 오류가 발생했습니다.', error as Error);
      if (!res.headersSent) {
        res.status(500).send('Slack 요청 처리에 실패했습니다.');
      }
    });
  }
}

@Controller('slack')
export class SlackEventsController {
  constructor(private readonly slackBolt: SlackBoltService) {}

  @All('events')
  async handleEvents(@Req() req: RawBodyRequest<Request>, @Res() res: Response): Promise<void> {
    await this.slackBolt.dispatch(req, res);
  }
}

@Module({
  imports: [DiscoveryModule],
  providers: [SlackBoltService, SlackAgentHandlers],
  controllers: [SlackEventsController],
  exports: [SlackBoltService],
})
export class SlackModule {}

// AgentEventBridge 예시
export class SlackEventPublisher implements EventPublisher {
  publish(channel: string, payload: unknown) {
    // Slack socket or webhook 연동
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const agentService = app.get(AgentService);
  const publisher = new SlackEventPublisher();
  const bridge = new AgentEventBridge(agentService, publisher);
  await bridge.attachAll();
  await app.listen(3000);
}
```

## Todo

### 0단계: 프로젝트 환경 스캐폴딩 (현재 작업 범위)

- [x] NestJS 애플리케이션 기본 구조(AppModule, bootstrap 함수) 생성
- [x] SlackModule과 SlackBoltService 골격 구성 및 SlackEventsController를 통한 Bolt 라우팅 준비
- [x] 빌드/테스트 스크립트, tsconfig, Vitest 설정 추가로 작업 환경 구성

### 1단계: 도메인/커넥터 기반 기본 기능 구현

- [ ] ChatEvent·OutgoingMessage에 `attachments`와 제네릭 `meta` 정의
- [ ] ChatConnector 제네릭 인터페이스 정의
- [ ] AgentCache(LRU+TTL) 구현
- [ ] ChannelAgentRegistry가 AgentCache를 활용하도록 구현
- [ ] OrchestratorAgent 구현 및 채널별 다중 에이전트 제어
- [ ] ChannelAgentConfigService 및 에이전트 생성 API 구현 (core `AgentService` 활용)
- [ ] `AgentEventBridge` 통합 및 Slack/Discord 이벤트 퍼블리셔 구현
- [ ] SlackConnector 구현 및 slash command 처리
- [x] SlackBoltService로 Bolt `App` 초기화, SlackEventsController를 통한 요청 위임, `SetMetadata`·`Reflector` 기반 메타데이터 데코레이터와 DiscoveryService 자동 바인딩
- [x] SlackEvent·SlackCommand·SlackAction·SlackParam 데코레이터와 MetadataScanner·Reflector 기반 메타데이터 익스플로러 유닛 테스트 작성
- [x] Slack 파라미터 데코레이터 메타데이터(인덱스·소스·path)와 buildSlackParameterArray/resolveSlackParamValue 헬퍼 유닛 테스트 작성
- [ ] NestJS 모듈 구성 (AppModule, ConnectorModule, AgentModule, ChannelModule)
- [ ] core `AgentService`와 각 레지스트리 연동, 채널 매핑·에이전트 관리 API 작성
- [ ] 활성화된 에이전트 목록 조회 API (`AgentService.listAgents`) 구현
- [ ] MCP 도구·지식·메모리·프리셋 API를 core 서비스에서 노출
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성 (채널 매핑 + Slack 이벤트/슬래시 커맨드 모킹)
- [ ] 문서 업데이트

## 작업 순서

1. **1단계**: ChatEvent·OutgoingMessage·ChatConnector·AgentCache·ChannelAgentRegistry 기본 구현과 NestJS 프로젝트 스캐폴딩, Bolt `App`의 ExpressReceiver를 SlackEventsController에 위임하는 라우팅과 `SetMetadata`·Reflector·MetadataScanner 기반 데코레이터 탐색 및 SlackParam 파라미터 데코레이터 메타데이터/주입기 구현으로 DiscoveryService 자동 바인딩 구성
2. **2단계**: ChannelAgentConfigService, SlackConnector(이벤트·slash command), OrchestratorAgent 구현과 core 서비스 연동, 에이전트 생성·채널 매핑 API, 활성화된 에이전트 목록·MCP·지식·메모리·프리셋 API 노출, LRU 캐시 연동, `AgentEventBridge` 통합
3. **3단계**: 단위/통합 테스트와 문서 정리
