# Slack Bot Overview (WIP)

> Slack Bot 서버 패키지의 현재 상태와 향후 작업 로드맵을 요약한 문서입니다. 구현은 진행 중이며, 자세한 계획은 `apps/slack-bot/plan/SLACK_BOT_SERVER_PLAN.md`를 참고하세요.

## Status & Scope

- ✅ NestJS 기반 기본 서버 스캐폴딩(`main.ts`, `AppModule`, `SlackModule`)과 Slack Bolt 연동 골격이 준비되어 있습니다.
- ✅ Slack Bolt 이벤트/커맨드 핸들러를 Nest 프로바이더 메타데이터로 자동 탐색하고 바인딩하는 데코레이터(`@SlackEvent`, `@SlackCommand`, `@SlackAction`, 파라미터 데코레이터) 및 유닛 테스트가 포함되어 있습니다.
- ✅ Slack 이벤트 엔드포인트(`/slack/events`)는 Express raw body 처리를 통해 Slack 서명 검증에 필요한 `rawBody`를 유지합니다.
- ⏳ Agent 실행 파이프라인(core `AgentService`, `AgentEventBridge`, 채널·에이전트 매핑 서비스 등)은 계획 단계이며 실제 산업용 로직은 아직 미구현 상태입니다.
- ⏳ Slack Slash Command UX, Channel/Agent Registry, MCP/지식/메모리 API 등은 향후 단계에서 구현합니다.

## Architecture Snapshot

```mermaid
flowchart TD
  A[Slack Events / Commands] -->|ExpressReceiver| B(SlackBoltService)
  B --> C[Discovered Nest Handlers]
  B --> D[SlackController (HTTP /slack/events)]
  D --> B
  subgraph NestJS Application
    AppModule --> SlackModule
    SlackModule --> SlackBoltService
    SlackModule --> SlackController
  end
```

- `SlackBoltService`
  - `DiscoveryService` + `MetadataScanner` + `Reflector`를 사용하여 Nest 프로바이더에서 Slack 데코레이터 메타데이터를 탐색합니다.
  - Bolt `App`/`ExpressReceiver`를 초기화하고, 바인딩된 핸들러에 메서드 파라미터 주입 로직 (`buildSlackParameterArray`)을 적용합니다.
- `SlackController`
  - `/slack/events`로 들어오는 HTTP 요청을 `SlackBoltService`의 `dispatch` 메서드로 위임합니다.
- `main.ts`
  - Express Raw/JSON/URL-Encoded 파서를 조건부로 등록해 Slack 이벤트 서명 검증을 지원하고, 기타 라우트는 일반 JSON 파서를 사용합니다.

## Source Layout

```
apps/slack-bot/
├── src/
│   ├── main.ts                 # Nest 부트스트랩 및 Express 미들웨어 설정
│   ├── app.module.ts           # SlackModule 로드
│   ├── slack/
│   │   ├── slack.module.ts     # DiscoveryModule + SlackBoltService wiring
│   │   ├── slack.controller.ts # /slack/events 엔드포인트
│   │   ├── slack-bolt.service.ts
│   │   └── slack.decorators.ts # 이벤트/커맨드/액션/파라미터 데코레이터
│   └── __tests__/
│       └── slack.decorators.test.ts # 메타데이터/파라미터 주입 유닛 테스트
├── plan/SLACK_BOT_SERVER_PLAN.md    # 상세 기능 계획 (미구현 항목 다수)
├── tsconfig.json / tsconfig.tests.json
└── vitest.config.ts
```

## Setup & Usage

1. **환경 변수 설정**

   Slack Bolt 앱 연동을 위해 다음 환경 변수를 설정합니다.

   ```bash
   export SLACK_SIGNING_SECRET="<your-signing-secret>"
   export SLACK_BOT_TOKEN="xoxb-..."
   export PORT=3000 # 선택, 기본값 3000
   ```

2. **개발 서버 실행**

   ```bash
   pnpm --filter @agentos/slack-bot install
   pnpm --filter @agentos/slack-bot build   # 또는 dev 모드: pnpm --filter @agentos/slack-bot dev
   pnpm --filter @agentos/slack-bot start
   ```

   현재는 Slack 이벤트/커맨드 핸들러를 등록할 Nest 프로바이더를 직접 구현해야 합니다. 예시:

   ```typescript
   // 예시 Provider (추가 필요)
   @Injectable()
   class SlackEchoHandler {
     @SlackCommand('/agent-echo')
     handleCommand(
       @SlackCommandPayload('text') text: string | undefined,
       @SlackRespond() respond: RespondFn
     ) {
       respond({ text: `echo: ${text ?? ''}` });
     }
   }
   ```

   `SlackEchoHandler` 같은 프로바이더를 모듈에 등록하면 `SlackBoltService`가 자동으로 탐색해 `/agent-echo` 커맨드에 바인딩합니다.

3. **테스트**

   ```bash
   pnpm --filter @agentos/slack-bot test
   ```

   Vitest 기반으로 Slack 데코레이터/파라미터 주입 로직을 검증합니다.

## Roadmap / Next Steps

아래 항목은 `SLACK_BOT_SERVER_PLAN.md` 기준 주요 남은 작업 요약입니다.

- ChatConnector/AgentPipeline
  - `ChatEvent`, `OutgoingMessage`, `ChatConnector` 제네릭 인터페이스 도입
  - LRU+TTL `AgentCache`, Channel-Agent Registry, Orchestrator Agent 구성
  - core `AgentService`, `AgentEventBridge` 연동 및 채널별 에이전트 관리 API 구현
- Slack UX & 확장성
  - Slash Command/Modal UX 완성, SlackConnector 구현, Discord 등 다른 커넥터 후속 작업
- 데이터/운영
  - MCP 도구/지식/메모리/프리셋 연동 API
  - 통합 테스트 (Slack 이벤트 + 채널 매핑 시나리오) 및 운영 문서 정리

## 참고 자료

- 계획서: `apps/slack-bot/plan/SLACK_BOT_SERVER_PLAN.md`
- Core 서비스: `docs/packages/core/index.md`
- 테스트 가이드: `docs/30-developer-guides/testing.md`
