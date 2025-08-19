# Main/Common 모듈 구성 가이드 (NestJS)

이 디렉터리는 GUI Main 프로세스에서 `@agentos/core` 모듈을 NestJS DI 컨테이너 위에 안전하게 올려 쓰기 위해 준비된 공용 모듈 집합입니다. 커밋 `e959ef03d6d7c5a814d3e43548b6487317701237` 기준으로 LLM 브릿지 레지스트리 초기화 흐름이 정리되었으며, 아래 구조로 모듈을 구성·관리합니다.

## 구성 요약

- **ElectronAppModule**: Electron `app`과 `ElectronAppEnvironment`를 글로벌 제공. `userData` 경로 등 환경 의존 초기화에 사용.
- **LlmBridgeModule**: `FileBasedLlmBridgeRegistry`를 앱 데이터 디렉터리에 생성해 DI로 제공.
- **McpRegistryModule**: `McpRegistry`를 단일 인스턴스로 제공.
- **AgentCoreModule**: Agent 메타 저장소/채팅 매니저/LLM 브릿지 레지스트리/MCP 레지스트리를 조합하여 `SimpleAgentService`를 DI로 제공.
- **AgentSessionModule**: 위 코어 모듈을 가져와 컨트롤러/서비스에서 실제 에이전트 API를 노출(EventPattern 기반).

## 주요 토큰과 프로바이더

- `apps/gui/src/main/common/model/constants.ts`
  - **`LLM_BRIDGE_REGISTRY_TOKEN`**: `FileBasedLlmBridgeRegistry` 인스턴스 주입 토큰
- `apps/gui/src/main/common/agent/constants.ts`
  - **`AGENT_METADATA_REPOSITORY_TOKEN`**: 파일 기반 Agent 메타데이터 저장소
  - **`CHAT_MANAGER_TOKEN`**: 파일 기반 채팅 매니저(`FileBasedChatManager`)
  - **`AGENT_SERVICE_TOKEN`**: `SimpleAgentService` (매니저 제거 후 서비스 중심)

## 모듈 상세

### ElectronAppModule
- **제공**: `ELECTRON_APP_TOKEN`, `ElectronAppEnvironment`
- **역할**: `app.getPath('userData')` 등 환경 정보 접근을 표준화

### LlmBridgeModule
- **파일**: `common/model/llm-bridge.module.ts`
- **제공**: `LLM_BRIDGE_REGISTRY_TOKEN`
- **초기화**:
  - `userData/bridges` 아래에 **`FileBasedLlmBridgeRegistry`** 생성
  - **`DependencyBridgeLoader`**로 브릿지 로딩

```ts
@Module({
  providers: [{
    provide: LLM_BRIDGE_REGISTRY_TOKEN,
    inject: [ElectronAppEnvironment],
    useFactory: (env) => new FileBasedLlmBridgeRegistry(
      path.join(env.userDataPath, 'bridges'),
      new DependencyBridgeLoader()
    ),
  }],
  exports: [LLM_BRIDGE_REGISTRY_TOKEN],
})
export class LlmBridgeModule {}
```

### McpRegistryModule
- **제공**: `McpRegistry` 단일 인스턴스
- **역할**: MCP 연결/툴 조회/호출의 런타임 레지스트리

### AgentCoreModule
- **의존**: `McpRegistryModule`, `LlmBridgeModule`
- **제공**:
  - `AGENT_METADATA_REPOSITORY_TOKEN` → `FileAgentMetadataRepository(userData/agents)`
  - `CHAT_MANAGER_TOKEN` → `FileBasedChatManager(userData/sessions, NoopCompressor)`
  - `AGENT_SERVICE_TOKEN` → `SimpleAgentService(llmBridgeRegistry, mcpRegistry, chatManager, repo)`

```ts
@Module({
  imports: [McpRegistryModule, LlmBridgeModule],
  providers: [
    // 1) 파일 기반 메타 저장소
    { provide: AGENT_METADATA_REPOSITORY_TOKEN, useFactory: (env) => new FileAgentMetadataRepository(path.join(env.userDataPath, 'agents')), inject: [ElectronAppEnvironment] },
    // 2) 파일 기반 채팅 매니저
    { provide: CHAT_MANAGER_TOKEN, useFactory: (env) => new FileBasedChatManager(new FileBasedSessionStorage(path.join(env.userDataPath, 'sessions')), new NoopCompressor(), new NoopCompressor()), inject: [ElectronAppEnvironment] },
    // 3) 에이전트 서비스 (서비스 중심)
    { provide: AGENT_SERVICE_TOKEN, useFactory: (llm, mcp, chat, repo) => new SimpleAgentService(llm, mcp, chat, repo), inject: [LLM_BRIDGE_REGISTRY_TOKEN, McpRegistry, CHAT_MANAGER_TOKEN, AGENT_METADATA_REPOSITORY_TOKEN] },
  ],
  exports: [AGENT_SERVICE_TOKEN, AGENT_METADATA_REPOSITORY_TOKEN],
})
export class AgentCoreModule {}
```

### AgentSessionModule
- **의존**: `AgentCoreModule`, `McpRegistryModule`
- **제공**: `AgentSessionService` + `AgentSessionController`
- **역할**: Main 마이크로서비스 레이어에서 `@EventPattern('agent:*')` 핸들러 노출

## 앱 부트스트랩과 조합

- `AppModule`은 `ElectronAppModule`(Global), `AgentSessionModule`을 가져와 전체 그래프를 구성합니다.
- Electron/Nest 마이크로서비스는 `ElectronEventTransport`로 프레임 기반 통신(req/res/err/nxt/end/can)을 사용합니다.
- Outbound 이벤트는 `common/event/outbound-channel.ts`를 통해 단일 채널로 방출 → 컨트롤러에서 스트림으로 노출(`agent.events`).

## 사용 예시 (의존성 주입)

```ts
import { Inject } from '@nestjs/common';
import { AGENT_SERVICE_TOKEN } from '../common/agent/constants';
import type { AgentService } from '@agentos/core';

@Injectable()
class FooService {
  constructor(@Inject(AGENT_SERVICE_TOKEN) private readonly agents: AgentService) {}

  async run() {
    const a = await this.agents.getAgent('my-agent');
    // ...
  }
}
```

## 확장/커스터마이즈 포인트

- **브릿지 저장 위치 변경**: `LlmBridgeModule`의 `userData/bridges` 경로를 다른 베이스로 교체
- **압축 전략 교체**: `FileBasedChatManager`의 컴프레서(NoopCompressor)를 실제 구현으로 대체
- **테스트 DI**: 각 토큰(`LLM_BRIDGE_REGISTRY_TOKEN`, `AGENT_SERVICE_TOKEN` 등)을 테스트 모듈에서 오버라이드하여 순수/메모리 구현 주입

## 참고 커밋/흐름
- `e959ef03…`: LLM 브릿지 레지스트리 모듈 초기화 로직 정리(DependencyBridgeLoader + userData 기반)
- 서비스 중심 아키텍처: `SimpleAgentService`가 매니저를 대체하여 `AgentService` 일원화
- GUI Main ↔ Renderer: 프레임 기반 스트림 + RxJS demux(`method` 필드를 통한 분기)

이 구조를 따르면 core 모듈의 런타임 의존성을 Main 프로세스의 OS/환경과 자연스럽게 연결할 수 있으며, 테스트/교체가 쉬운 NestJS DI 구성을 유지할 수 있습니다.
