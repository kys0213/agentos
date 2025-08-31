# CLI Core & Lang Integration Plan

## Requirements

### 성공 조건

- [ ] CLI가 `SimpleAgentService`와 `LlmBridgeRegistry`를 사용하여 에이전트를 생성·검색·실행할 수 있다.
- [ ] 기존 `history`, `sessions` 명령은 새로운 서비스 기반 구조에서도 동작한다.
- [ ] 커맨드라인에서 에이전트 관리(`agent list/create/run`) 기능이 제공된다.
- [ ] 커서 기반 페이징과 LRU 캐시는 각각 `@agentos/core`와 `@agentos/lang`으로 교체된다.
- [ ] `docker run agentos/cli`처럼 베이스 이미지를 실행한 뒤 `agentos config`로 성격·LLM 설정을 주입할 수 있다.
- [ ] CLI는 Codex CLI·Claude Code와 유사한 사용성을 제공하여 다중 파일 편집, 코드 실행, GUI 기능을 터미널에서도 활용할 수 있다.
- [ ] `preset`, `llm`, `memory`, `knowledge` 각 도메인이 중앙 관리 서버와 로컬 파일 저장소 중 하나를 설정으로 선택할 수 있다.
- [ ] `preset`은 `@agentos/core`의 `PresetRepository` 인터페이스를 사용하며 기본 구현은 파일 기반 저장소다.
- [ ] `memory`와 `knowledge`는 `@agentos/core`에 정의된 인터페이스를 사용하며 기본 구현은 인메모리 저장소다.

### 사용 시나리오

- [ ] 사용자는 `docker run agentos/cli`로 컨테이너를 띄운 뒤 `agentos config set persona mentor` 등으로 런타임 설정을 변경한다.
- [ ] 사용자는 `agentos agent create`로 에이전트를 만든 후 `agentos agent run <id> --task <task>`로 명령을 수행한다.
- [ ] 사용자는 `agentos sessions <agentId>`로 세션 목록을 조회하고 페이지 이동 시 캐시가 활용된다.
- [ ] 사용자는 `agentos config set preset.backend remote` 또는 `agentos config set memory.backend local`과 같이 도메인별 백엔드를 전환할 수 있다.

### 제약 조건

- [ ] Node.js 18+와 cross-platform 파일 시스템 경로 지원.
- [ ] 기존 CLI 명령과 호환성을 유지한다.
- [ ] 외부 LLM 브리지는 `LLM_BRIDGE` 환경 변수 또는 config를 통해 지정한다.
- [ ] 원격 백엔드 선택 시 네트워크 연결이 필수이며 로컬 모드는 파일 시스템 권한이 필요하다.

## CLI 명령어 개요

| 명령                                   | 사용 예                                    | 설명                              |
| -------------------------------------- | ------------------------------------------ | --------------------------------- |
| `agentos agent list`                   | `agentos agent list`                       | 등록된 에이전트 목록을 조회한다   |
| `agentos agent create <name>`          | `agentos agent create helper`              | 새 에이전트를 생성한다            |
| `agentos agent run <id> --task <task>` | `agentos agent run 123 --task "코드 리뷰"` | 지정한 에이전트를 실행한다        |
| `agentos preset list`                  | `agentos preset list`                      | 사용 가능한 프리셋을 확인한다     |
| `agentos preset use <name>`            | `agentos preset use mentor`                | 현재 세션에 프리셋을 적용한다     |
| `agentos llm list`                     | `agentos llm list`                         | 등록된 LLM 브리지 목록을 조회한다 |
| `agentos llm set <bridge>`             | `agentos llm set openai`                   | 사용할 LLM 브리지를 변경한다      |
| `agentos memory show`                  | `agentos memory show`                      | 메모리 스토어 내용을 확인한다     |
| `agentos memory clear`                 | `agentos memory clear`                     | 메모리 스토어를 초기화한다        |
| `agentos knowledge add <file>`         | `agentos knowledge add README.md`          | 지식 저장소에 파일을 추가한다     |
| `agentos knowledge fetch <query>`      | `agentos knowledge fetch "테스트"`         | 저장된 지식을 검색한다            |
| `agentos sessions <agentId>`           | `agentos sessions 123`                     | 에이전트의 세션 목록을 조회한다   |
| `agentos history <sessionId>`          | `agentos history abc`                      | 특정 세션의 대화 기록을 확인한다  |
| `agentos config set <key> <value>`     | `agentos config set persona mentor`        | 설정 값을 변경한다                |
| `agentos config get <key>`             | `agentos config get persona`               | 설정 값을 확인한다                |

## Interface Sketch

```typescript
// apps/cli/src/bootstrap.ts
export interface CliContext {
  agentService: AgentService;
  llmBridgeRegistry: LlmBridgeRegistry;
  mcpRegistry: McpRegistry;
}

export async function bootstrap(): Promise<CliContext>;

// apps/cli/src/commands/agent.ts
program.command('agent').command('list').command('create <name>').command('run <agentId>');

// config & preset commands
program.command('config').command('set <key> <value>').command('get <key>');
program.command('preset').command('list').command('use <name>');

// backend stores
import {
  PresetRepository,
  MemoryStore,
  KnowledgeStore,
  InMemoryMemoryStore,
  InMemoryKnowledgeStore,
} from '@agentos/core';

export class FilePresetRepository implements PresetRepository {
  /* ... */
}
export class RemotePresetRepository implements PresetRepository {
  /* ... */
}

const presetRepository: PresetRepository = new FilePresetRepository();
const memoryStore: MemoryStore = new InMemoryMemoryStore();
const knowledgeStore: KnowledgeStore = new InMemoryKnowledgeStore();

// pagination utilities
import { CursorPagination } from '@agentos/core';
import { LinkedDeque } from '@agentos/lang';
```

## Todo

- [ ] `bootstrap.ts`를 `SimpleAgentService`, `LlmBridgeRegistry`, `McpRegistry` 초기화 로직으로 교체.
- [ ] 기존 명령을 `AgentService` 기반으로 리팩터링하여 `interactiveChat` 의존성을 제거.
- [ ] `PresetRepository`, `MemoryStore`, `KnowledgeStore` 코어 인터페이스 기반으로 구현을 작성하고, `PresetRepository`는 파일/원격 저장소를, `MemoryStore`와 `KnowledgeStore`는 기본 인메모리 저장소를 제공한다.
- [ ] `config` 명령에 `presetBackend`, `llmBackend`, `memoryBackend`, `knowledgeBackend` 키를 추가하여 주입 로직 구현.
- [ ] 신규 `agent` 하위 명령(`list`, `create`, `run`) 구현.
- [ ] `history`/`sessions` 모듈의 커스텀 `paginate`와 `PageCache`를 `CursorPagination`과 `LinkedDeque` 기반으로 대체.
- [ ] CLI 출력 포매팅에 `@agentos/lang`의 문자열/날짜 유틸 적용.
- [ ] `config`/`preset` 명령을 추가하여 런타임 성격·LLM 설정과 프리셋 관리 지원.
- [ ] 단위/통합 테스트 작성 및 `pnpm format`, `pnpm build`, `pnpm test` 실행.
- [ ] 문서(`apps/cli/docs/`) 갱신.

## 작업 순서

1. **부트스트랩 개편**: `bootstrap.ts`에서 레지스트리와 서비스 초기화, 기본 LLM 브리지 로딩.
2. **서비스 기반 리팩터링**: 기존 명령을 `AgentService`와 `CursorPagination`을 사용하도록 수정하고 `interactiveChat` 제거.
3. **스토어 백엔드 선택 기능**: `PresetRepository`는 파일/원격 구현체를 도입하고, `MemoryStore`와 `KnowledgeStore`는 코어 인메모리 구현을 기본으로 사용하며 `config` 명령으로 전환 로직을 구성.
4. **에이전트 명령 추가**: `agent` 명령군을 `run` 서브커맨드와 함께 구현.
5. **컨테이너 런타임 설정**: `config`/`preset` 명령을 통해 도커 컨테이너 내부에서 성격과 LLM을 구성하는 흐름을 정의.
6. **lang 적용**: `PageCache`를 `LinkedDeque`로 재작성하고 출력에 문자열/날짜 유틸 사용.
7. **테스트 & 문서**: 새 기능에 대한 테스트 작성 후 포맷/빌드/테스트 실행, 관련 문서 업데이트.

## 중장기 로드맵

### Remote/Local Backend 선택

- [ ] `preset`, `llm`은 파일/원격 구현을 제공하며 `preset`은 `@agentos/core`의 `PresetRepository` 인터페이스를 사용한다. `memory`, `knowledge`는 코어 인메모리 저장소를 기본으로 하되 향후 원격/로컬 확장을 고려한다.

### MCP & 프리셋 확장

- [ ] `mcp list/run` 명령을 통해 MCP 실행 및 관리 기능을 추가한다.
- [ ] 공용 프리셋 저장소를 도입하여 `preset add/use` 명령으로 에이전트 구성을 공유한다.

### 컨테이너 런타임 설정 & 성격 주입

- [ ] 공식 베이 이미지를 실행한 뒤 `agentos config`로 성격·LLM·도구 프리셋을 적용할 수 있다.
- [ ] CI 파이프라인에서 베이스 이미지만 유지하고 런타임 설정 스크립트만 검증한다.

### CLI UX 고도화

- [ ] Codex CLI·Claude Code처럼 다중 파일 편집, 즉시 실행, GUI 명령 팔레트 연동을 지원한다.

### LLM 고도화

- [ ] 프리셋 기반 LLM 프로파일을 지원하여 다양한 모델 설정을 손쉽게 전환한다.
- [ ] 복수 LLM 백엔드와 라우팅 규칙을 정의하고 CLI에서 선택적으로 사용한다.

### Memory & Knowledge

- [ ] 코어 `MemoryStore`/`KnowledgeStore` 인터페이스 기반으로 인메모리 저장소를 제공하여 세션 간 컨텍스트를 유지한다.
- [ ] 도메인 지식 저장 및 검색 명령(`knowledge add/fetch`)을 제공하여 에이전트 지식 기반을 확장한다.

### 장기 목표

- [ ] CLI와 GUI가 MCP, 프리셋, LLM, 메모리, 지식 레이어를 공유하여 일관된 사용자 경험을 제공한다.
- [ ] 확장 가능한 플러그인 구조를 갖추어 서드파티 확장을 수용한다.
