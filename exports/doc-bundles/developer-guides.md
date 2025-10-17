# AgentOS Docs — Developer Guides Bundle

> Generated on 2025-10-17T01:05:07.348Z


---

## Source Directory: docs/30-developer-guides

### File: docs/30-developer-guides/ai-collaboration.md

<!-- Source: docs/30-developer-guides/ai-collaboration.md -->

# AI 에이전트 협력 가이드라인

이 문서는 AI 에이전트(Cursor, Claude Code, Gemini, Codex 등)가 사용자와 협력할 때 따라야 하는 워크플로우와 리뷰 프로세스를 정의합니다.

## 기본 원칙

> **"계획 먼저, 코드 나중"**
>
> 모든 AI 에이전트는 코드 작성 전에 반드시 계획을 수립하고 사용자의 승인을 받아야 합니다.

## 협력 워크플로우

### 1단계: 문제 이해 및 명확화

**에이전트 역할:**

- 사용자 요구사항을 분석하고 이해
- 불분명한 부분에 대해 구체적인 질문
- 작업 범위와 목표 명확화

**사용자 역할:**

- 요구사항을 구체적으로 설명
- 에이전트의 질문에 명확한 답변 제공
- 제약 조건이나 특별한 고려사항 공유

**완료 조건:**

- [ ] 요구사항이 명확하게 정의됨
- [ ] 작업 범위가 합의됨
- [ ] 제약 조건이 파악됨

### 2단계: 복잡도 판단

**에이전트 역할:**

- [복잡도 판단 가이드라인](https://github.com/kys0213/agentos/blob/main/docs/30-developer-guides/complexity-guide.md)을 참고하여 접근 방식 결정
- 판단 근거와 결과를 사용자에게 공유
- 필요시 분할정복 방식으로 작업 세분화

**사용자 역할:**

- 에이전트의 복잡도 판단 검토
- 추가 고려사항이나 제약 조건 제공
- 접근 방식에 대한 피드백

**완료 조건:**

- [ ] 복잡도 판단이 완료됨
- [ ] 접근 방식(단순함 우선 vs 분할정복)이 결정됨
- [ ] 사용자가 판단에 동의함

### 3단계: 계획 수립

**에이전트 역할:**

- [작업계획서 템플릿](https://github.com/kys0213/agentos/blob/main/docs/90-templates/PLAN_TEMPLATE.md)을 사용하여 계획서 작성
- 요구사항, 인터페이스 초안, Todo 리스트, 작업 순서 포함
- 테스트 계획 포함

**사용자 역할:**

- 계획서 내용 검토
- 누락된 요구사항이나 고려사항 지적
- 우선순위나 접근 방식 조정 요청

**완료 조건:**

- [ ] 완전한 계획서가 작성됨
- [ ] 모든 필수 항목이 포함됨
- [ ] 테스트 계획이 포함됨

### 4단계: 계획 리뷰 및 승인

**에이전트 역할:**

- 계획서를 명확하게 제시
- 사용자 피드백에 따라 계획서 수정
- 승인 요청 및 확인

**사용자 역할:**

- 계획서 상세 검토
- 구체적인 피드백 제공
- 최종 승인 또는 수정 요청

**승인 기준:**

- [ ] 모든 요구사항이 반영됨
- [ ] 기술적 접근 방식이 적절함
- [ ] 작업 순서가 논리적임
- [ ] 테스트 계획이 충분함
- [ ] 예상 결과가 명확함

### 5단계: 구현

**에이전트 역할:**

- 승인된 계획에 따라 단계별 구현
- 중요한 결정사항이나 변경사항 즉시 공유
- 중간 체크포인트에서 진행 상황 보고

**사용자 역할:**

- 중간 진행 상황 검토
- 필요시 방향 조정 지시
- 예상치 못한 문제 해결 협력

**중간 체크포인트:**

- [ ] 핵심 인터페이스 구현 완료 시
- [ ] 주요 기능 구현 완료 시
- [ ] 예상과 다른 상황 발생 시

### 6단계: 최종 검토

**에이전트 역할:**

- 완성된 코드와 테스트 결과 제시
- 계획서 대비 구현 결과 비교
- 문서 업데이트 및 정리

**사용자 역할:**

- 최종 결과물 검토
- 요구사항 충족 여부 확인
- 추가 개선사항 제안

**완료 조건:**

- [ ] 모든 요구사항이 구현됨
- [ ] 테스트가 통과됨
- [ ] 문서가 업데이트됨
- [ ] 사용자가 결과에 만족함

## 커뮤니케이션 가이드라인

### 계획서 제시 시

```
📋 **작업 계획서**

다음과 같이 작업을 계획했습니다:

[계획서 내용]

이 계획에 대해 검토해주시고, 수정이 필요한 부분이나 추가 고려사항이 있으면 말씀해주세요.
승인해주시면 구현을 시작하겠습니다.
```

### 피드백 요청 시

```
🤔 **검토 요청**

[구체적인 질문이나 확인사항]

어떻게 진행하면 좋을지 의견 부탁드립니다.
```

### 진행 상황 보고 시

```
⚡ **진행 상황**

현재 진행 상황:
- [완료된 작업]
- [진행 중인 작업]
- [다음 단계]

예상치 못한 이슈나 변경사항이 있으면 즉시 알려드리겠습니다.
```

## 예외 상황 처리

### 계획 변경이 필요한 경우

1. **즉시 작업 중단**
2. **변경 사유와 새로운 계획 제시**
3. **사용자 승인 후 재개**

### 기술적 문제 발생 시

1. **문제 상황 명확히 설명**
2. **대안 제시**
3. **사용자와 해결 방안 논의**

### 요구사항 변경 시

1. **변경 영향도 분석**
2. **새로운 계획서 작성**
3. **전체 워크플로우 재시작**

## 체크리스트

### 에이전트 자가 점검

- [ ] 사용자 요구사항을 정확히 이해했는가?
- [ ] 복잡도 판단이 적절한가?
- [ ] 계획서가 완전한가?
- [ ] 사용자 승인을 받았는가?
- [ ] 계획에 따라 구현하고 있는가?
- [ ] 중요한 변경사항을 공유했는가?

### 사용자 검토 포인트

- [ ] 요구사항이 정확히 반영되었는가?
- [ ] 기술적 접근 방식이 적절한가?
- [ ] 작업 범위가 합리적인가?
- [ ] 테스트 계획이 충분한가?
- [ ] 예상 결과가 만족스러운가?

### File: docs/30-developer-guides/code-style.md

<!-- Source: docs/30-developer-guides/code-style.md -->

# Code Style Guide

This project uses **TypeScript** with ESLint and Prettier to keep the codebase consistent.

- Run `pnpm lint` to check lint errors.
- Run `pnpm format` to automatically format files.
- Follow the rules defined in `.eslintrc.json` and `.prettierrc`.
- Use arrow function parentheses and avoid unused variables unless prefixed with `_`.

## Additional Guidelines

1. **SOLID Principles** — design modules and classes to obey SOLID principles for maintainability.
2. **Clean Architecture** — aim for a clear dependency flow and avoid circular references.
3. **Test-Driven Development** — write tests first when adding new behavior.
4. **Type Safety** — favor generics and avoid `any`. If you must accept unknown input, use `unknown` and guard types before use.
5. **One Class per File** — 한 파일에는 하나의 클래스만 선언합니다. 유지보수성과 검색성, 순환 의존성 방지에 유리합니다. (ESLint `max-classes-per-file: ["error", 1]` 적용)

### One Class per File 규칙 예외

- 테스트 파일(`**/__tests__/**`, `*.test.ts`, `*.spec.ts`)은 작은 mock/helper 클래스를 함께 둘 수 있도록 최대 2개까지 경고 수준으로 허용합니다. 파일이 커지면 분리하세요.
- `index.ts`(barrel 파일)는 클래스를 직접 선언하지 말고 재-export만 수행합니다.
- 인터페이스/타입/enum은 이 규칙의 대상이 아니지만, 클래스와 섞여 과도하게 커질 경우 파일을 분리하는 것을 권장합니다.

## Control Flow & Readability

- **Always use braces**: All control statements (if/else/for/while/try-catch) must use braces.
- **No single-line blocks**: Even for short conditions, write blocks on multiple lines.
  - Bad: `if (ready) { start(); }`
  - Good:
    ```ts
    if (ready) {
      start();
    }
    ```
- **Ternary usage**: Avoid nested ternaries altogether. When Prettier/ESLint 경고(`multiline-ternary`)가 발생하면 `if/else` 또는 `switch`로 풀어 쓰세요. 한 줄짜리 조건부는 괜찮지만, 표현식이 길거나 중첩되면 반드시 블록으로 전개합니다.

### Lint 경고 정리 Playbook

- **`multiline-ternary`**: 가독성이 낮은 삼항은 즉시 `if/else` 블록으로 전환합니다. 동일한 조건을 여러 곳에서 쓰면 의미 있는 헬퍼 함수로 추출하세요.
- **`@typescript-eslint/no-unused-vars`**: 사용하지 않는 변수/임포트는 제거합니다. UI 컴포넌트의 옵션처럼 인터페이스만 유지해야 하는 경우 접두사 `_`를 붙여 ESLint에 의도를 명확히 합니다.
- **UI Select 사용**: Chakra UI 잔재를 없애기 위해 셀렉트 컴포넌트는 반드시 `../ui/select`(Radix 기반)에서 가져옵니다. Chakra `Select` 임포트가 남아 있으면 린트 경고로 취급하고 교체하세요.
- **테마/스타일**: 공통 토큰(`status-*`, `sidebar-*` 등)을 직접 하드코딩하지 말고 `globals.css` 셋업을 따릅니다. 새로운 상태색이 필요하면 토큰을 먼저 추가하고 컴포넌트에서 사용할 것.

위 규칙을 지키면 새 린트 경고는 대부분 `pnpm lint -- --max-warnings=0` 단계에서 차단됩니다.

## Naming Conventions

- **Conventional first**: 보편적으로 통용되는 이름을 우선합니다. 특별한 설명 없이도 이해 가능한 용어를 선택하세요.
- **Avoid internal jargon**: 팀 내부 은어/메타포 대신, 외부 기여자가 이해할 수 있는 일반 용어를 사용합니다.
- **Disambiguate "index"**: 디렉터리 이름으로 `index`를 지양합니다. 검색/색인 맥락은 `indexing` 또는 `search-index` 같은 명확한 용어를 사용합니다.
- **No clever abbreviations**: 축약/암호화된 네이밍을 피하고, 의미가 드러나는 전체 단어를 사용합니다.
- **Consistency across code/docs**: 코드와 문서에서 동일한 용어를 사용합니다. 명칭 변경 시 코드/문서/ToC를 함께 갱신합니다.
- **English identifiers**: 코드 식별자는 영어를 사용합니다. 필요 시 주석에 한글 병기 가능합니다.

## Frontend Architecture

- **Container/Presentation Split**
  - Presentation components: consume synchronous props only. No server/IPC access inside. Reusable, dumb.
  - Container components: use React Query to load/mutate server state via IPC fetchers, then inject data/handlers into presentation.
  - Query keys standard: lists `['presets']`, item `['preset', id]`, agents `['agents']`.

- **IPC Fetchers (Renderer)**
  - Fetchers call `ServiceContainer.resolve('<service>')` and the corresponding Protocol methods.
  - Map Core/loose types to app DTOs at the boundary; never pass loose types to presentation.
  - Handle domain mismatches (e.g., status variants) explicitly in adapters.

- **Shared UI Extraction**
  - Repeated input groups (e.g., preset basic fields, model settings) must be extracted into shared components.
  - Options (categories, model lists) should be injected via props for testability/i18n.

## Dead Code and Console

- Remove unused code and exports before PR. Use:
  - `npx ts-prune` for dead exports
  - ESLint `import/no-unused-modules` to catch unused modules
- Avoid `console.*` in committed code; keep only `console.warn`/`console.error` for critical paths.

## Pre‑push Quality Checks

```bash
pnpm -r typecheck
pnpm -r lint -- --max-warnings=0
npx ts-prune
```

### File: docs/30-developer-guides/complexity-guide.md

<!-- Source: docs/30-developer-guides/complexity-guide.md -->

# 복잡도 판단 기준 가이드라인

이 문서는 "단순함 우선"과 "분할정복" 중 어떤 접근 방식을 선택할지 판단하는 구체적인 기준을 제공합니다.

## 기본 원칙

- **단순함 우선**: 가장 직접적이고 명확한 해결책을 먼저 시도
- **분할정복**: 복잡한 문제를 작은 단위로 나누어 체계적으로 해결

## 단순함 우선 적용 조건

다음 조건들에 **모두** 해당하는 경우 단순한 접근 방식을 선택:

- ✅ 단일 파일 또는 모듈 내에서 해결 가능
- ✅ 기존 패턴/아키텍처를 그대로 따르면 됨
- ✅ 외부 의존성 추가 불필요
- ✅ 예상 작업 시간 2시간 이내
- ✅ 영향 범위가 제한적 (다른 모듈에 영향 없음)

## 분할정복 적용 기준

다음 중 **2개 이상**에 해당하는 경우 분할정복 접근 방식을 선택:

- □ 3개 이상의 파일 수정 필요
- □ 새로운 의존성 또는 외부 시스템 연동 필요
- □ 기존 인터페이스나 API 변경 필요
- □ 3개 이상의 다른 모듈/패키지에 영향
- □ 복잡한 비즈니스 로직 (5단계 이상의 처리 과정)
- □ 새로운 아키텍처 패턴 도입 필요
- □ 성능, 보안, 에러 처리 등 비기능적 요구사항 고려 필요
- □ 예상 작업 시간 2시간 이상

## 예시 상황별 판단

### 단순함 우선 적용 예시

- 기존 함수에 매개변수 추가
- 단순 버그 수정
- UI 텍스트 변경
- 기존 로직의 미세한 조정
- 단일 컴포넌트 내 상태 관리 개선

### 분할정복 적용 예시

- 새로운 기능 전체 구현
- 아키텍처 변경 또는 리팩토링
- 외부 API 연동
- 복잡한 비즈니스 로직 구현
- 여러 모듈에 걸친 데이터 플로우 변경
- 새로운 테스트 전략 도입

## 판단이 애매한 경우

- **보수적 접근**: 확실하지 않다면 분할정복 선택
- **점진적 접근**: 단순함으로 시작해서 복잡해지면 분할정복으로 전환
- **동료 상의**: 판단이 어려운 경우 사용자와 검토

## 작업 중 복잡도 변화 대응

- 단순한 작업이 예상보다 복잡해지면 **즉시 중단**하고 분할정복으로 전환
- 계획서 작성 후 다시 시작
- 이미 진행한 작업은 첫 번째 단계로 활용

### File: docs/30-developer-guides/interface-spec.md

<!-- Source: docs/30-developer-guides/interface-spec.md -->

# Interface Specifications

Key interfaces reside in `packages/core`.

- `Agent` — `src/agent/agent.ts` defines the `chat()` method, sessions, and metadata access.
- `Chat` — `src/chat` contains Core message/content types and file-based session helpers.
- `MCP` — `src/tool/mcp` contains MCP registry/repository/service and usage tracking.
- `Memory` — `src/memory` contains graph-store and orchestrator for memory operations.

## Routing API (Core Orchestrator)

Public exports are available via `@agentos/core`.

- Types: `RouterQuery`, `RouterOutput`, `AgentRouter`, `RoutingStrategyFn`, `ScoreResult`, `BuildDocFn`.
- Implementations: `CompositeAgentRouter`.
- Strategies (v1): `BM25TextStrategy`, `MentionStrategy`, `KeywordBoostStrategy`, `ToolHintStrategy`, `FileTypeStrategy`.
- Tokenizers: `EnglishSimpleTokenizer` (default), `LlmKeywordTokenizer` (optional via DI).

Usage

```ts
import {
  CompositeAgentRouter,
  BM25TextStrategy,
  MentionStrategy,
  KeywordBoostStrategy,
  ToolHintStrategy,
  FileTypeStrategy,
  EnglishSimpleTokenizer,
} from '@agentos/core';

// Construct router with strategy set and DI tokenizer
const router = new CompositeAgentRouter(
  [BM25TextStrategy, MentionStrategy, KeywordBoostStrategy, ToolHintStrategy, FileTypeStrategy],
  { tokenizer: new EnglishSimpleTokenizer() }
);

// Build query
const query: RouterQuery = {
  text: 'sort an array of numbers',
  hints: ['toolsort'],
  content: [],
};

// Route among agents (assumes you have Agent instances)
const { agents, scores } = await router.route(query, candidateAgents, {
  topK: 3,
  includeScores: true,
});
// agents: sorted best → worst
// scores: optional per-agent composite scores and breakdown metadata
```

Notes

- Deterministic order: ties are broken by status → lastUsed → usageCount → name → id.
- Status gating: `active` by default; `idle` requires a matching hint; `inactive`/`error` excluded by default.
- Privacy: strategy metadata should avoid raw user input; provide matched tokens/terms only.

Implementations can extend these interfaces or provide new ones that conform to the same contracts.

### File: docs/30-developer-guides/README.md

<!-- Source: docs/30-developer-guides/README.md -->

# Developer Guides (Overview)

- Testing: `./testing.md`
- TypeScript Typing: `./typescript-typing-guidelines.md`
- Code Style: `./code-style.md`
- Complexity Guide: `./complexity-guide.md`
- Interface Spec: `./interface-spec.md`
- AI Collaboration: `./ai-collaboration.md`

실무 가이드를 이 섹션으로 모읍니다.

### File: docs/30-developer-guides/testing.md

<!-- Source: docs/30-developer-guides/testing.md -->

# Testing Guide

Unit tests use **Vitest** with native ESM support. Test files live under `__tests__/` directories (or `*.test.ts` / `*.spec.ts`).

Run all tests from the repository root:

```bash
pnpm test
```

For package-scoped watch mode during development:

```bash
pnpm --filter <workspace> test -- --watch
```

## 테스트 철학 (Testing Philosophy)

### 계층별 테스트 전략

AgentOS는 클린 아키텍처 기반으로 계층별 차별화된 테스트 전략을 적용합니다:

#### 1. **코어 모듈 (100% 커버리지 필수)**

```
packages/core/src/common/
├── utils/           # parseJson, safeZone, uuid
├── pagination/      # cursor-pagination
└── scheduler/       # scheduler
```

- **순수함수** 또는 **단일책임원칙** 기반 컴포넌트
- **100% 테스트 커버리지** 유지 필수
- 모든 엣지 케이스와 에러 시나리오 커버
- 여러 계층에서 재사용되므로 완전한 신뢰도 보장

#### 2. **도메인 모듈 (블랙박스 테스트)**

```
packages/core/src/
├── mcp/            # MCP 클라이언트 래퍼
├── chat/           # 채팅 세션 관리
├── agent/          # 에이전트 구현
└── preset/         # 프리셋 관리
```

- 코어 모듈은 **블랙박스**로 취급
- 해당 모듈의 **비즈니스 로직**만 테스트
- 외부 의존성은 **mocking** 필수
- 내부 리팩토링 시에도 테스트 유지

#### 3. **응용 계층 (통합 테스트)**

```
apps/
├── cli/            # CLI 애플리케이션
├── gui/            # GUI 애플리케이션
└── slack-bot/      # 슬랙봇 애플리케이션
```

- **사용자 시나리오** 기반 통합 테스트
- E2E 테스트로 전체 플로우 검증
- 실제 사용자 경험 검증

### 결정적 테스트 (Deterministic Testing)

**packages 하위 모듈은 모두 application에서 재사용**되므로, 외부 의존성이 있는 부분은 **mocking을 통한 결정적 테스트**가 필수입니다.

#### 외부 의존성 mocking 대상

- **네트워크 통신** (MCP 서버, HTTP 요청)
- **파일 시스템** (파일 읽기/쓰기)
- **시간 의존적 로직** (setTimeout, setInterval)
- **데이터베이스 연결**
- **환경 변수**

## 🏗️ 테스트 구조 설계 원칙

### 1. Fixture와 Mock 분리 원칙

**✅ 권장: Fixture 파일 활용**

```typescript
// src/tool/mcp/registry/__tests__/fixture.ts
export class MockMcpToolRepository implements McpToolRepository {
  private tools = new Map<string, McpToolMetadata>();
  private eventHandlers = new Map<string, EventHandler[]>();

  async create(config: McpConfig): Promise<McpToolMetadata> {
    const tool = {
      /* 실제 객체 생성 */
    };
    this.tools.set(tool.id, tool);
    this.emit('changed', { id: tool.id, metadata: tool });
    return tool;
  }
  // ... 완전한 구현
}
```

**❌ 지양: 테스트 파일 내 인라인 Mock**

```typescript
// 테스트 파일 내에서 복잡한 Mock 구현하지 말 것
const mockRepo = {
  get: vi.fn(),
  // ... 복잡한 구현들 (권장하지 않음)
};
```

### 2. 의존성 주입 패턴

**✅ 생성자 수정으로 의존성 주입 지원**

```typescript
// 프로덕션 코드에서 의존성 주입 가능하도록 설계
export class McpMetadataRegistry {
  constructor(
    private readonly repository: McpToolRepository,
    private readonly mcpRegistry: McpRegistry // 의존성 주입
  ) {
    // ...
  }
}

// 테스트에서 활용
describe('McpMetadataRegistry', () => {
  let mockMcpRegistry: ReturnType<typeof mock<McpRegistry>>;

  beforeEach(() => {
    mockMcpRegistry = mock<McpRegistry>();
    registry = new McpMetadataRegistry(mockRepository, mockMcpRegistry);
  });
});
```

**❌ 지양: Reflection을 통한 내부 속성 교체**

```typescript
// 이런 방식은 지양
(registry as any).mcpRegistry = mockMcpRegistry;
```

## 🔧 Mock 패턴 가이드라인

### 1. vitest-mock-extended 활용

**인터페이스 Mock 생성**

```typescript
import { mock } from 'vitest-mock-extended';

const mockMcpRegistry: ReturnType<typeof mock<McpRegistry>> = mock<McpRegistry>();
```

### 2. 계층별 Mock 전략

#### Repository Layer

- **Complete Mock Implementation**: 실제 동작을 시뮬레이션하는 완전한 구현체 제공
- **상태 관리**: 내부 Map을 사용한 데이터 저장
- **이벤트 시스템**: 실제 이벤트 발생 및 구독 시뮬레이션

```typescript
export class MockMcpToolRepository implements McpToolRepository {
  private tools = new Map<string, McpToolMetadata>();
  private eventHandlers = new Map<string, EventHandler[]>();

  async create(config: McpConfig): Promise<McpToolMetadata> {
    const tool = {
      /* 실제 객체 생성 */
    };
    this.tools.set(tool.id, tool);
    this.emit('changed', { id: tool.id, metadata: tool });
    return tool;
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);

    return () => {
      const handlers = this.eventHandlers.get(event)!;
      const index = handlers.indexOf(handler);
      if (index >= 0) handlers.splice(index, 1);
    };
  }
}
```

#### Service Layer

- **Vitest Function Mock**: 단순한 vi.fn() Mock 활용
- **기본 동작 설정**: 필요한 경우에만 mockResolvedValue 등으로 설정

```typescript
const createMockMcpRegistry = () => ({
  register: vi.fn(),
  unregister: vi.fn(),
  get: vi.fn().mockResolvedValue(null),
  getAll: vi.fn().mockResolvedValue([]),
  isRegistered: vi.fn().mockReturnValue(false),
  // ...
});
```

#### Protocol Layer

- **External Library Mock**: 외부 라이브러리는 vitest-mock-extended 활용
- **최소 구현**: 테스트에 필요한 메서드만 Mock

## 📝 테스트 작성 패턴

### 1. 테스트 파일 구조

```typescript
// 1. Import 섹션
import { mock } from 'vitest-mock-extended';
import { Subject } from './subject-to-test';
import { Dependency } from './dependency';
import { MockRepository } from './fixture'; // Fixture 활용

// 2. Mock 팩토리 함수들
const createMockDependency = (): Dependency => {
  return {
    method: vi.fn(),
    asyncMethod: vi.fn().mockResolvedValue(defaultValue),
    // ... 모든 메서드 구현
  };
};

// 3. 테스트 Suite
describe('Subject', () => {
  let subject: Subject;
  let mockDependency: MockProxy<Dependency>;

  beforeEach(async () => {
    mockDependency = createMockDependency();
    subject = new Subject(mockDependency);
    await subject.initialize();
  });

  describe('feature group', () => {
    it('should describe specific behavior', async () => {
      // Given - 설정
      mockDependency.method.mockResolvedValue(expectedResult);

      // When - 실행
      const result = await subject.performAction();

      // Then - 검증
      expect(result).toBe(expectedResult);
      expect(mockDependency.method).toHaveBeenCalledWith(expectedParams);
    });
  });
});
```

### 2. 비동기 테스트 패턴

**✅ async/await 활용**

```typescript
it('should handle async operations', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});

it('should reject with error', async () => {
  mockDependency.method.mockRejectedValue(new Error('Test error'));
  await expect(service.methodThatFails()).rejects.toThrow('Test error');
});
```

### 3. 이벤트 테스트 패턴

**Promise 기반 이벤트 검증**

```typescript
it('should emit events correctly', async () => {
  const eventPromise = new Promise((resolve) => {
    service.on('eventName', resolve);
  });

  await service.triggerEvent();
  const event = await eventPromise;

  expect(event).toEqual(expectedEventPayload);
});
```

## 🎯 테스트 검증 원칙

### 1. 정확한 Assertion

**✅ 구체적인 검증**

```typescript
// 객체 구조 검증
expect(result).toEqual({
  items: expect.any(Array),
  nextCursor: '',
  hasMore: false,
});

// 함수 호출 검증
expect(mockMethod).toHaveBeenCalledWith(
  expectedParam1,
  expect.objectContaining({
    property: expectedValue,
  }),
  undefined
);

// 날짜나 복잡한 객체 검증
expect(mockRepository.update).toHaveBeenCalledWith(
  toolId,
  expect.objectContaining({
    usageCount: 1,
    lastUsedAt: expect.any(Date),
  }),
  undefined
);
```

**❌ 모호한 검증**

```typescript
expect(result).toBeTruthy(); // 너무 모호함
expect(mockMethod).toHaveBeenCalled(); // 파라미터 검증 누락
```

### 2. 오류 시나리오 테스트

```typescript
it('should handle connection failure gracefully', async () => {
  mockMcpRegistry.register.mockRejectedValue(new Error('Connection failed'));

  await expect(registry.registerTool(config)).rejects.toThrow('Failed to register MCP tool');

  // 부분적 성공 검증
  expect(registry.totalToolsCount).toBe(1); // 메타데이터는 저장됨
  expect(registry.getTool(toolId)?.status).toBe('error'); // 상태는 오류
});
```

## Unit Test Guidelines

### 1. 기본 규칙

- Test files must end with `.test.ts`
- Test files live under `__tests__` directories
- Use **Vitest** with the workspace `vitest.config.ts`
- Use **vitest-mock-extended** for creating type-safe mocks
- Write deterministic unit tests using mocks

### 2. 코어 모듈 테스트 작성

#### ✅ 좋은 코어 모듈 테스트 예시

```typescript
// packages/core/src/common/utils/__tests__/parseJson.test.ts
describe('parseJson', () => {
  it('should parse valid JSON string', () => {
    const result = parseJson('{"key": "value"}');
    expect(result).toEqual({ key: 'value' });
  });

  it('should return null for invalid JSON', () => {
    const result = parseJson('invalid json');
    expect(result).toBeNull();
  });

  it('should handle null input', () => {
    const result = parseJson(null);
    expect(result).toBeNull();
  });

  it('should handle undefined input', () => {
    const result = parseJson(undefined);
    expect(result).toBeNull();
  });

  it('should handle empty string', () => {
    const result = parseJson('');
    expect(result).toBeNull();
  });
});
```

#### ✅ 좋은 도메인 모듈 테스트 예시

```typescript
// packages/core/src/mcp/__tests__/mcp.test.ts
import { mock, MockProxy } from 'vitest-mock-extended';

describe('Mcp', () => {
  let mockClient: MockProxy<Client>;
  let mockTransport: MockProxy<Transport>;
  let mcp: Mcp;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock client using vitest-mock-extended
    mockClient = mock<Client>();

    // Setup mock transport using vitest-mock-extended
    mockTransport = mock<Transport>();

    // Create Mcp instance
    mcp = new Mcp(mockClient, mockTransport, mockConfig);
  });

  it('should connect to MCP server', async () => {
    mockClient.connect.mockResolvedValue(undefined);

    await mcp.connect();

    expect(mockClient.connect).toHaveBeenCalledWith(mockTransport);
  });

  it('should handle connection failure', async () => {
    mockClient.connect.mockRejectedValue(new Error('Connection failed'));

    await expect(mcp.connect()).rejects.toThrow('MCP 연결 실패: Connection failed');
  });
});
```

### 3. 외부 의존성 mocking 전략

#### 파일 시스템 mocking

```typescript
// packages/core/src/chat/file/__tests__/file-based-chat-session.test.ts
import { promises as fs } from 'fs';
import { MockProxy } from 'vitest-mock-extended';

vi.mock('fs/promises');
const mockFs = vi.mocked(fs);

describe('FileBasedChatSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save session to file', async () => {
    mockFs.writeFile.mockResolvedValue(undefined);

    const session = new FileBasedChatSession('test-session', '/mock/path');
    await session.commit();

    expect(mockFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('test-session'),
      expect.any(String)
    );
  });

  it('should handle file write error', async () => {
    mockFs.writeFile.mockRejectedValue(new Error('Disk full'));

    const session = new FileBasedChatSession('test-session', '/mock/path');

    await expect(session.commit()).rejects.toThrow('Disk full');
  });
});
```

#### 시간 의존적 로직 mocking

```typescript
// packages/core/src/common/scheduler/__tests__/scheduler.test.ts
describe('Scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute callback after specified time', () => {
    const mockCallback = vi.fn();
    const scheduler = new Scheduler();

    scheduler.schedule(mockCallback, 1000);

    expect(mockCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
```

#### 네트워크 통신 mocking

```typescript
// packages/core/src/mcp/__tests__/mcp-transport.test.ts
import fetch from 'node-fetch';
import { vi } from 'vitest';

vi.mock('node-fetch');
const mockFetch = vi.mocked(fetch);

describe('McpTransport', () => {
  it('should send HTTP request', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'success' }),
    } as any);

    const transport = new HttpMcpTransport(config);
    const result = await transport.send(message);

    expect(result).toEqual({ result: 'success' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/mcp'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      })
    );
  });
});
```

## 📁 파일 조직 구조

```
src/
├── feature/
│   ├── __tests__/
│   │   ├── fixture.ts          # Mock 구현체들
│   │   ├── feature.test.ts     # 메인 테스트
│   │   └── integration.test.ts # 통합 테스트
│   ├── feature.ts
│   └── feature-service.ts
```

### 4. 테스트 작성 체크리스트

#### 코어 모듈 체크리스트

- [ ] 모든 public 메서드가 테스트됨
- [ ] 모든 에러 케이스가 커버됨
- [ ] 경계값 테스트 포함
- [ ] null/undefined 입력 처리 확인
- [ ] 100% 코드 커버리지 달성

#### 도메인 모듈 체크리스트

- [ ] 외부 의존성이 모두 mocking됨
- [ ] 비즈니스 로직이 정확히 테스트됨
- [ ] 에러 전파가 올바르게 처리됨
- [ ] 코어 모듈 내부는 테스트하지 않음
- [ ] 의존성 주입을 통한 테스트 구조 설계
- [ ] Fixture 파일로 복잡한 Mock 분리

#### 일반 테스트 체크리스트

- [ ] 테스트가 결정적으로 동작함
- [ ] 테스트 간 격리가 보장됨
- [ ] 의미 있는 테스트 이름 사용
- [ ] Given-When-Then 패턴 적용
- [ ] vitest-mock-extended 활용한 타입 안전 Mock

## ✨ 베스트 프랙티스

### 1. 테스트 독립성

- 각 테스트는 다른 테스트에 의존하지 않아야 함
- `beforeEach`에서 깨끗한 상태로 초기화
- 공유 상태 사용 금지

### 2. 테스트 명명 규칙

```typescript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should expected behavior', () => {
      // 테스트 구현
    });
  });
});
```

### 3. 테스트 데이터 관리

- 테스트별로 명확한 데이터 설정
- 하드코딩된 값보다는 의미있는 상수 사용
- 테스트 간 데이터 공유 최소화

### 4. 커버리지 목표

- 핵심 비즈니스 로직: 90% 이상
- 유틸리티 함수: 100%
- 통합 테스트: 주요 시나리오 커버

### 5. 임시 파일/디렉터리 관리 (테스트 산출물 정리)

- OS 임시 디렉터리 사용: `os.tmpdir()` + `fs.mkdtemp`로 테스트별 고유 경로를 생성하세요.
- 정리 책임: `afterEach` 또는 `afterAll`에서 생성한 파일/폴더를 반드시 삭제하세요.
- 저장 위치 원칙: 레포지토리 내부 고정 경로(예: `__tests__/tmp`) 사용을 지양합니다. 불가피할 경우 정리 훅을 통해 항상 비워둡니다.
- .gitignore 의존 금지: 산출물 무시는 임시 조치일 뿐입니다. 테스트가 스스로 정리하도록 구현하세요.

예시: 고유 임시 디렉터리 생성 + 정리

```ts
// __tests__/example.test.ts
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

describe('feature using temp files', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentos-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('writes a file to temp dir', async () => {
    const file = path.join(tmpDir, 'data.json');
    await fs.writeFile(file, JSON.stringify({ ok: true }), 'utf-8');
    const text = await fs.readFile(file, 'utf-8');
    expect(JSON.parse(text).ok).toBe(true);
  });
});
```

예시: 레포 내부 임시 디렉터리를 부득이하게 사용할 때

```ts
// __tests__/example-in-repo.test.ts
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

describe('legacy tmp path', () => {
  const tmpDir = path.join(__dirname, 'tmp');

  beforeEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
```

## 🚨 주의사항

### 금지사항

1. **실제 외부 서비스 호출**: 모든 외부 의존성은 Mock 처리
2. **과도한 Private 메서드 테스트**: Public API를 통한 간접 테스트 우선
3. **테스트를 위한 프로덕션 코드 수정**: 테스트를 위해 설계 변경 금지
4. **복잡한 Setup**: 테스트 setup이 테스트 자체보다 복잡하면 안됨
5. **Reflection 기반 Mock 주입**: `(obj as any).prop = mock` 패턴 지양

### 권장사항

1. **Fail Fast**: 오류 상황을 빠르게 감지할 수 있는 테스트 작성
2. **명확한 의도**: 테스트 이름과 구현에서 의도가 명확히 드러나야 함
3. **지속적 리팩토링**: 테스트 코드도 프로덕션 코드만큼 품질 관리
4. **문서화**: 복잡한 테스트 케이스는 주석으로 설명 추가
5. **의존성 주입 설계**: 테스트하기 쉬운 구조로 프로덕션 코드 설계

## E2E Test Guidelines

### 1. 기본 규칙

- End-to-end test files must end with `.e2e.test.ts`
- 실제 사용자 시나리오 기반 테스트
- 응용 계층에서만 사용

### 2. E2E 테스트 예시

```typescript
// apps/cli/__tests__/chat-flow.e2e.test.ts
describe('CLI Chat Flow', () => {
  it('should handle complete chat session', async () => {
    // Given: CLI 애플리케이션 시작
    const cli = new CliApp();

    // When: 사용자가 메시지 입력
    const result = await cli.processInput('Hello, world!');

    // Then: 적절한 응답 생성
    expect(result).toContain('Hello');
    expect(result).not.toContain('Error');
  });
});
```

## 테스트 실행 전략

### 1. 로컬 개발

```bash
# 전체 테스트 실행
pnpm test

# 특정 패키지 테스트
pnpm --filter @agentos/core test

# 워치 모드
pnpm dev

# 커버리지 포함
pnpm test --coverage
```

### 2. CI/CD 파이프라인

```bash
# 코어 모듈 100% 커버리지 검증
pnpm test --coverage --coverageThreshold='{"global":{"branches":100,"functions":100,"lines":100,"statements":100}}'

# 병렬 테스트 실행
pnpm test --maxWorkers=4
```

## 성능 고려사항

### 1. 테스트 속도 최적화

- 외부 의존성 mocking으로 I/O 제거
- 병렬 테스트 실행
- 불필요한 setup/teardown 최소화

### 2. 메모리 관리

- 각 테스트 후 mock 정리
- 대용량 테스트 데이터 재사용
- 메모리 누수 방지

## 트러블슈팅

### 1. 흔한 문제들

- **비결정적 테스트**: 외부 의존성 mocking 확인
- **테스트 간 간섭**: beforeEach/afterEach에서 상태 초기화
- **타이밍 이슈**: vi.useFakeTimers() 사용

### 2. 디버깅 팁

```typescript
// 테스트 디버깅
it.only('should debug this test', () => {
  console.log('Debug info:', testData);
  // 테스트 로직
});

// Mock 호출 확인
expect(mockFunction).toHaveBeenCalledWith(
  expect.objectContaining({
    key: expect.any(String),
  })
);
```

### 3. Playwright E2E 테스트

- GUI QA는 Playwright 테스트(`pnpm --filter @agentos/apps-gui test:e2e`)로 시각적/행동 플로우를 검증합니다.
- 로컬에서 `pnpm --filter @agentos/apps-gui dev`로 앱을 실행하거나, 테스트 실행 시 Playwright가 자동으로 개발 서버를 기동하는지 확인합니다.
- 새 시나리오를 추가하려면 `apps/gui/e2e/` 디렉터리에 테스트 파일을 생성하고 필요한 헬퍼를 `apps/gui/e2e/utils/`에서 재사용합니다.

### 4. Playwright MCP 도구 (Model Context Protocol)

- Playwright MCP는 Model Context Protocol 기반의 외부 도구로, 브라우저를 원격 제어하며 수동 QA를 돕습니다.
- 기본 서버/명령:
  ```bash
  npx -y @playwright/mcp@latest
  ```
- 제공 도구:
  `browser_click`, `browser_close`, `browser_console_messages`, `browser_drag`, `browser_evaluate`,
  `browser_file_upload`, `browser_fill_form`, `browser_handle_dialog`, `browser_hover`, `browser_install`,
  `browser_navigate`, `browser_navigate_back`, `browser_network_requests`, `browser_press_key`,
  `browser_resize`, `browser_select_option`, `browser_snapshot`, `browser_tabs`, `browser_take_screenshot`,
  `browser_type`, `browser_wait_for`
- 공식 테스트 스위트는 아니며, Playwright E2E 통과 이후 추가적인 수동 검증이나 디버깅이 필요할 때 사용합니다.

### File: docs/30-developer-guides/typescript-typing-guidelines.md

<!-- Source: docs/30-developer-guides/typescript-typing-guidelines.md -->

# TypeScript 타이핑 지침

## 🚨 any 타입 사용 금지 원칙

이 프로젝트에서는 **`any` 타입 사용을 절대 금지**합니다. `any`는 TypeScript의 타입 안전성을 무력화시키며, 런타임 오류와 디버깅 어려움을 야기합니다.

### ⛔ 금지: `as any` 단언(assertion)

`as any`는 규칙적으로 금지합니다. 즉각적인 편의 대신, 다음 중 하나로 대체하세요.

- 구체 타입 정의/제네릭 도입으로 올바른 타입을 전달
- `unknown` + 타입 가드(zod/사용자 정의)로 런타임 검증 후 사용
- 유니온/내로잉을 통해 안전한 분기 처리

예시 — 잘못된 사용 vs 대안

```ts
// ❌ 금지
const id = (frame as any).cid;

// ✅ 대안 1: 공용 필드가 있는 판별 유니온이면 바로 접근
const id = frame.cid;

// ✅ 대안 2: zod/가드 사용
const parsed = FrameSchema.safeParse(frame);
if (!parsed.success) throw new Error('invalid frame');
const id2 = parsed.data.cid;
```

## 1. any 대신 사용할 타입들

### 1.1 unknown 타입

외부에서 받아온 데이터나 타입을 알 수 없는 경우:

```typescript
// ❌ 잘못된 예
function processData(data: any) {
  return data.someProperty; // 타입 체크 없음
}

// ✅ 올바른 예
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'someProperty' in data) {
    return (data as { someProperty: unknown }).someProperty;
  }
  throw new Error('Invalid data structure');
}
```

### 1.2 제네릭 타입

재사용 가능한 컴포넌트나 함수에서:

```typescript
// ❌ 잘못된 예
function sendMessage<T>(action: string, payload: any): Promise<any> {
  // ...
}

// ✅ 올바른 예
function sendMessage<T, R>(action: string, payload: T): Promise<R> {
  // ...
}
```

### 1.3 Union 타입

여러 타입 중 하나인 경우:

```typescript
// ❌ 잘못된 예
interface MessageContent {
  content: any;
}

// ✅ 올바른 예
interface MessageContent {
  content: string | object | ArrayBuffer;
}
```

### 1.4 인덱스 시그니처

동적 속성을 가진 객체:

```typescript
// ❌ 잘못된 예
interface Config {
  [key: string]: any;
}

// ✅ 올바른 예
interface Config {
  [key: string]: string | number | boolean | undefined;
}

// 더 나은 예 - 명시적 속성과 함께
interface LlmBridgeConfig {
  name: string;
  type: 'openai' | 'anthropic' | 'local' | 'custom';
  apiKey?: string;
  model?: string;
  [key: string]: unknown; // 확장 가능한 설정
}
```

## 2. 도메인별 타입 정의 가이드

### 2.1 IPC 통신 타입

모든 IPC 메서드는 명확한 입력/출력 타입을 가져야 합니다:

```typescript
// ✅ 올바른 예
interface BridgeService {
  register(id: string, config: LlmBridgeConfig): Promise<{ success: boolean }>;
  getCurrentBridge(): Promise<{ id: string; config: LlmBridgeConfig } | null>;
}

// MCP 도구 실행 인자
interface McpToolArgs {
  [key: string]: string | number | boolean | object | null | undefined;
}
```

### 2.2 API 응답 타입

API 응답은 항상 구체적인 타입을 정의합니다:

```typescript
// ✅ 도구 실행 응답
interface ToolExecutionResponse {
  success: boolean;
  result?: unknown; // 도구별로 다른 응답이므로 unknown 사용
  error?: string;
}

// ✅ 메시지 응답
interface MessageListResponse {
  messages: MessageRecord[];
  total?: number;
  hasMore?: boolean;
  nextCursor?: string;
}
```

## 3. 타입 안전성 검증 패턴

### 3.1 타입 가드 함수

unknown 타입을 안전하게 사용하기 위한 타입 가드:

```typescript
function isLlmBridgeConfig(obj: unknown): obj is LlmBridgeConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'type' in obj &&
    typeof (obj as any).name === 'string' &&
    ['openai', 'anthropic', 'local', 'custom'].includes((obj as any).type)
  );
}

// 사용 예
function processBridgeConfig(config: unknown) {
  if (isLlmBridgeConfig(config)) {
    // 이제 config는 LlmBridgeConfig 타입으로 안전하게 사용 가능
    console.log(config.name);
  }
}
```

### 3.2 Assertion 함수

타입을 확신할 수 있는 경우:

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Expected string');
  }
}

// 사용 예
function processId(id: unknown) {
  assertIsString(id);
  // 이제 id는 string 타입으로 취급됨
  return id.toUpperCase();
}
```

## 4. 레거시 코드 마이그레이션

### 4.1 단계별 접근법

1. **타입 정의 먼저**: 새로운 구체적 타입들을 core-types.ts에 정의
2. **인터페이스 업데이트**: 공개 인터페이스부터 any 제거
3. **구현체 업데이트**: 각 구현체에서 구체적 타입 사용
4. **테스트 및 검증**: 타입 에러 수정 및 동작 확인

### 4.2 Deprecated 함수 처리

기존 함수와의 호환성이 필요한 경우:

```typescript
/**
 * @deprecated Use bridgeService.register() instead
 */
async register(id: string, config: LlmBridgeConfig): Promise<void> {
  console.warn('BridgeManager.register() is deprecated');
  // 구체적 타입 사용하되 기존 동작 유지
}
```

## 5. ESLint 규칙 설정

`.eslintrc.js`에 다음 규칙을 추가하여 any 사용을 방지:

```javascript
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    // 선택: `as any` 단언을 더 엄격히 차단 (TS 파서 필요)
    'no-restricted-syntax': [
      'error',
      {
        selector: 'TSAsExpression > TSAnyKeyword',
        message: "Do not use 'as any'; use proper typing, generics, or runtime guards.",
      },
    ],
  },
};
```

## 6. 코드 리뷰 체크리스트

Pull Request 시 다음 사항을 확인:

- [ ] 새로운 `any` 타입이 추가되지 않았는가?
- [ ] `as any` 단언이 없는가?
- [ ] `unknown` 사용 시 적절한 타입 가드가 있는가?
- [ ] 인터페이스에 구체적인 타입이 정의되어 있는가?
- [ ] 제네릭을 사용할 수 있는 곳에서 `any` 대신 제네릭을 사용했는가?
- [ ] 외부 라이브러리 타입이 누락되지 않았는가?

## 7. 예외 상황 처리

### 7.1 외부 라이브러리

타입 정의가 없는 외부 라이브러리:

```typescript
// ✅ 별도 타입 선언 파일 생성
declare module 'some-library' {
  export function someFunction(param: string): boolean;
}

// 또는 최소한의 타입 정의
interface SomeLibraryResponse {
  [key: string]: unknown;
}
```

### 7.2 Chrome API

브라우저 API의 경우:

## 8. 추가 지침 (Adapter/Pre-push/경계 설계)

### 8.1 Adapter(매핑) 계층 권장

- Core/외부의 느슨한 타입을 앱 레이어 DTO로 변환한 뒤 UI에 주입합니다.
- 예) IPC fetcher에서 `Preset`/`LlmBridgeConfig`를 `AppPreset`/`AppLlmBridgeConfig`로 매핑.

### 8.2 단언 최소화

- `as any`/이중 단언은 금지합니다. `unknown` + 타입가드, 구체 타입/제네릭으로 대체합니다.

### 8.3 Pre‑push 타입 안전성 체크

```bash
pnpm -r typecheck
pnpm -r lint -- --max-warnings=0
npx ts-prune # dead export 확인
```

### 8.4 컨테이너/프레젠테이션 경계의 타입

- 프레젠테이션: 동기 props만 소비(서버/IPC 접근 금지), DTO로 정규화된 타입만 사용
- 컨테이너: React Query + IPC fetchers로 비동기/뮤테이션 처리, invalidate 키 표준 유지
- 상태 도메인 불일치(예: UI draft vs core status)는 어댑터에서 명시적으로 매핑

```typescript
// ✅ 글로벌 타입 선언
declare global {
  const chrome: {
    runtime: {
      sendMessage: (
        message: ChromeExtensionMessage,
        callback: (response: ChromeExtensionResponse) => void
      ) => void;
    };
  };
}
```

## 8. 마이그레이션 완료 체크

다음 명령어로 any 타입 사용 여부 확인:

```bash
# any 타입 검색
grep -r ": any" src/renderer/
grep -r "any\[\]" src/renderer/
grep -r "Promise<any>" src/renderer/

# ESLint로 any 관련 에러 확인
npm run lint
```

## 결론

- **절대 `any` 사용 금지**
- **`unknown`, 제네릭, Union 타입 적극 활용**
- **타입 가드를 통한 안전한 타입 변환**
- **ESLint 규칙으로 자동 검증**
- **코드 리뷰에서 타입 안전성 확인**

이 지침을 따라 타입 안전한 코드를 작성하고, 런타임 오류를 예방하며, 코드의 가독성과 유지보수성을 향상시킵시다.

---

## 9. Electron/Preload & RPC 엄격 타이핑 지침 (강화)

- `as any` 금지: 이벤트/IPC 경계에서 `unknown` + 타입 가드/구체 타입을 사용합니다.
- 프레임 타입: `RpcFrame`(discriminated union: `req | res | err | nxt | end | can`)을 공용 타입으로 사용합니다.
- Preload는 테스트 가능한 팩토리로 분리합니다.
  - 예: `createElectronBridge(ipc: IpcLike)`, `createRpc(ipc: IpcLike)`
  - `IpcLike`는 `(event: unknown, payload: unknown)` 시그니처를 가진 `on/off`와 `send`만 포함합니다.
  - Electron 전역 의존 없이 순수 함수이므로 유닛 테스트 100% 커버리지가 가능합니다.
- 에러 타입: 서버 측 `CoreError` → 프레임 `err`로 매핑, 프리로드에서는 선택적으로 `toError(frame)` 훅으로 복원합니다.
- 전역 접근 금지: `window as any` 대신 전역 선언(`types.d.ts`)에 안전 API(`electronBridge`, `rpc`)를 명시합니다.

### 예시 (요지)

```ts
// factories (테스트 가능)
export interface IpcLike { on: (ch: string, l: (e: unknown, p: unknown) => void) => void; off: (...);
  send: (ch: string, payload: unknown) => void }
export function createElectronBridge(ipc: IpcLike) { /* start/post/on 구현 */ }
export function createRpc(ipc: IpcLike, opts?: { toError?: (f: RpcFrame) => Error }) { /* req→res/err */ }

// preload.ts
contextBridge.exposeInMainWorld('electronBridge', createElectronBridge(ipcRendererAdapter));
contextBridge.exposeInMainWorld('rpc', createRpc(ipcRendererAdapter));
```

## 10. 테스트 지침(Preload/RPC)

- 팩토리 기반으로 `MockIpc` 구현을 주입해 다음을 검증합니다.
  - `on()`의 구독/해제 동작과 핸들러 호출
  - `request()`의 `res` resolve / `err` reject / CID 불일치 프레임 무시
  - 응답 후 프레임 리스너 해제(메모리 누수 방지)
- 테스트에서 `any` 금지. 필요한 경우 `unknown`과 타입 가드를 사용합니다.

## 11. 린팅/정책 권고(점진 시행)

- 신규/변경 파일에 `@typescript-eslint/no-explicit-any: error` 적용(패키지별 점진 도입 권장).
- 테스트도 린트 대상에 포함하되, 과도한 차단을 피하기 위해 단계적 적용(폴더 단위 활성화).
- PR 체크리스트에 다음 항목 추가:
  - [ ] `as any`/이중 단언 없음
  - [ ] 경계(API/IPC/전역)에서 `unknown` + 가드 사용
  - [ ] 프레임/채널 이름이 공용 문서와 일치(IPC_TERMS_AND_CHANNELS.md)

## 12. 커밋/검토 원칙(타입 안전성)

- 커밋 단위는 기능/문서/테스트로 잘게 분리하여 회귀 지점을 명확히 합니다.
- 타입 제거/정밀화 커밋은 메시지 접두사로 표시: `types:`, `refactor(types):`, `test(types):`.
- 리뷰에서 `any`/`as any` 발견 시 변경 요청 필수. 예외는 외부 타입 선언 파일에 한정합니다.

_Included files: 7_