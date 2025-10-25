# AgentOS Docs — Process & Policy Bundle

> Generated on 2025-10-17T01:05:07.350Z


---

## Source Directory: docs/40-process-policy

### File: docs/40-process-policy/docs-policy.md

<!-- Source: docs/40-process-policy/docs-policy.md -->

# Docs & Plan Policy (Single Source)

본 문서는 리포지토리 전반에서 문서를 일관되게 운영하기 위한 정책의 단일 출처입니다. 문서 디렉토리 구조, 역할 구분, 통합/승격/정리 원칙, PR 요건을 정의합니다.

## 범위

- 루트 `docs/`: 공통 철학/가이드/워크플로우/정책(본 문서)
- 각 패키지 `apps/<name>/docs`: 패키지 사용자·개발자 가이드(개념/의도/기준 중심)
- 각 패키지 `apps/<name>/plan`: 요구사항/인터페이스 초안/TODO/작업 순서(진행 추적)

## 디렉토리 구조 원칙

- 도메인별 하위 폴더로 응집
  - 예: `docs/apps/gui/rpc/`(GUIDE/SPEC/TERMS/recipes), `docs/apps/gui/frontend/`(code-style/patterns/testing/roadmap)
- Deprecated 디렉토리 금지. 오래된 문서는 즉시 대체/삭제하며, 필요시 단기 스텁만 유지
- Archive 정책: 장기 보관을 지양. 필요 시 PR 본문/릴리스 노트로 이관 후 파일은 제거

## 문서 유형(역할)

- Spec: 계약/프로토콜/프레임/에러/취소 등 변경의 기준(Interface-first). SSOT(단일 출처).
- Guide: 개념/의도/사용 시나리오 중심. 구현 세부는 과도하게 담지 않음.
- Recipes: 실전 예제 모음(취소 패턴, 타입 추론, 네이밍 예시 등)
- Terms: 용어/채널/토픽 표준(SSOT). 모든 문서가 이를 참조.
- Plan: 요구사항/인터페이스 초안/TODO/작업 순서(완료 시 Docs로 승격 후 삭제)

## SSOT & 통합

- 같은 주제를 여러 문서가 기술하지 않도록 SSOT 선정(Spec/Terms 우선)
- 새 내용 추가 시 기존 문서 확장/병합을 우선. 새 문서를 만들 경우 기존 문서에 요약+링크 추가
- 중복/오래된 문서는 제거. 스텁은 단기(한두 스프린트)만 허용

## Plan → Docs 승격(요약)

- 시점: TODO 전부 완료 + 타입/테스트/빌드 통과 + 인터페이스 충돌 없음
- 승격: Plan 내용을 가이드/스펙으로 재구성(결과 중심). `plan/` 파일은 같은 PR에서 삭제
- PR 본문(필수): Plan 링크, AC 요약(3–5줄), TODO 상태, 변경 요약(3–7개), 검증 결과, 최종 Docs 경로, 기존 문서 병합/대체 내역

## 네이밍·링크 규칙

- 파일명은 사용자 관점으로 간결하게: 예) `rpc/GUIDE.md`, `rpc/SPEC.md`, `frontend/patterns.md`
- 인덱스: 도메인 폴더에 `README.md`로 내비게이션 제공
- 단일 출처 링크: Spec/Terms는 반드시 한 곳으로 수렴하고 모든 가이드/레시피가 이를 참조

## Git 워크플로우 연계

- 브랜치: 문서/구조 변경도 기능 브랜치(`feature/docs-...`)로
- 커밋: TODO·작업 단위(이동/승격/링크/인덱스 분리 권장)
- PR: 템플릿 필수(.github/pull_request_template.md). Plan 중심·검증 포함

## CI/Danger 권장

- FEATURE/Docs 변경 PR에서 `plan/` 잔존 또는 같은 주제 Plan/Docs 중복 시 실패
- 내부 링크 검증(ToC/상대 경로 깨짐 감지)

## 예시(앱: GUI)

- RPC: `docs/apps/gui/rpc/{GUIDE.md,SPEC.md,TERMS.md,recipes.md}`
- Frontend: `docs/apps/gui/frontend/{code-style.md,patterns.md,testing.md,roadmap.md}`
- Plan 통합: `apps/gui/plan/RPC_AND_STREAMING_CONSOLIDATED_PLAN.md`

보조 문서

- 코드 문서 스타일·주석 규칙: `docs/DOCUMENTATION_STANDARDS.md`
- 승격 상세 절차/체크리스트(참고용): `docs/PLAN_PROMOTION_GUIDE.md`

### File: docs/40-process-policy/documentation-standards.md

<!-- Source: docs/40-process-policy/documentation-standards.md -->

# 문서화 표준 (Documentation Standards)

이 문서는 AgentOS 프로젝트의 코드 주석, API 문서, 사용 예시 작성 표준을 정의합니다.

## 문서 디렉토리 구조

- 루트 `docs/`: 프로젝트 전반의 컨벤션, 철학 설계 원칙, 테스트 방법, Git 워크플로우 등을 관리합니다.
- 각 패키지(`<apps|packages>/<name>`)는 `docs/`와 `plan/` 디렉토리를 가질 수 있습니다.
  - `docs/`: 패키지 목적과 주요 기능, 사용법을 기록합니다.
  - `plan/`: 작업 전 요구사항 분석과 TODO를 작성합니다. 모든 TODO가 완료되면 내용을 `docs/`로 옮기고 계획서는 삭제합니다.
  - 새로운 문서를 추가할 때는 기존 문서를 살펴보고 관련 항목과 통합하도록 합니다.

## 계획서 승격 정책 (Plan → Docs)

- 완료 기준(모든 작업 유형 공통): `plan/<...>.md`의 모든 TODO가 완료되면 내용을 정리하여 같은 패키지의 `docs/<...>.md`로 승격하고, 원본 `plan/` 파일은 삭제합니다. 이 원칙은 feature, fix, perf, refactor 등 모든 작업 유형에 동일하게 적용됩니다.
- 병합/확장 우선: 유사 주제의 기존 문서가 있다면 새 문서를 만들지 말고 해당 문서를 최신 변경사항으로 갱신(섹션 추가, API 반영, 예시 보강)합니다.
- 분리 기준: 범위가 크고 독립 참조가 유리한 경우에만 새 문서를 생성하고, 기존 문서에는 요약 + 링크를 추가합니다.
- 제거 원칙: Deprecated 디렉토리는 만들지 않습니다. 노후/중복 문서는 제거 또는 최신 문서로 병합하고, 관련 링크/ToC를 즉시 갱신합니다.
- 메타데이터: 승격된 문서 상단에 목적, 적용 범위, 최종 업데이트 일자, 오너(리뷰어)를 명시합니다.

### 단일 진실 소스(SSOT)와 중복 제거

- 승격과 동시에 plan 문서는 삭제하여 동일 주제에 대해 Docs만 남깁니다. Plan과 Docs를 동시에 유지하지 않습니다.
- PR에서 Plan→Docs 승격이 이루어지면 같은 PR에서 plan 파일 삭제까지 포함합니다(후속 PR로 미루지 않음).
- 예제/코드 스니펫은 항상 최신 스펙을 따릅니다. 도메인 별 표준이 있는 경우 이를 명시합니다.
  - 예: GUI의 llm-bridge-spec에서 `Message.content`는 `MultiModalContent[]` 배열로 고정됩니다. 문서 예제도 반드시 배열을 사용합니다.
- 선택: CI/Danger로 "FEATURE 커밋인데 plan/ 파일이 남아있거나, Plan과 Docs가 같은 주제를 중복 기술"하는 경우 실패하도록 가드하는 것을 권장합니다.

### 문서의 추상화 수준 (Interface-first)

- 최종 문서는 내부 구현 세부(코드 라인/알고리즘 상세)보다 "외부 인터페이스, 계약(Contract), 시나리오"를 우선합니다.
- 포함해야 할 것: 공개 API/타입/메서드 시그니처, 입력/출력/에러, 상태/이벤트, 사용 시나리오, 제한사항.
- 포함하지 말 것: 내부 클래스 분할, private 함수 흐름, 일시적인 구현 세부. 이러한 변경은 리팩터링 시 문서 업데이트 대상이 아닙니다.

### 작업 유형별 문서 규칙

- Feature/Fix: 사양(스펙) 변화가 있으므로 기존 `docs/`를 변경된 인터페이스/동작에 맞게 반드시 갱신합니다. 필요 시 문서를 병합/확장하고 ToC/링크를 갱신합니다.
- Refactor: 외부 인터페이스/동작 변화가 없다면 문서 승격 없이 `plan/`만 삭제 가능합니다. PR 본문에 "인터페이스 변경 없음(No externally observable change)"을 명시하세요. 만약 인터페이스가 바뀌면 Feature/Fix 규칙을 따릅니다.
- Perf/Chore: 외부 계약 변화가 없으면 문서 수정은 선택 사항입니다. 측정치/운영 팁 등은 별도의 운영 문서에 추가할 수 있습니다.

### PR 수행 체크리스트 (Plan 승격)

- [ ] Plan TODO 전부 완료(체크박스 반영)
- [ ] `plan/<file>.md` → `docs/<file>.md` 승격 완료(내용 정리 포함)
- [ ] 원본 `plan/` 파일 삭제 (Deprecated 디렉토리 금지)
- [ ] 기존 유사 문서 조사 및 병합/확장 여부 판단, 반영
- [ ] ToC/README/링크 경로 갱신 (루트/패키지 README 포함)
- [ ] PR 본문에 승격된 문서 경로와 통합/추가/대체 내역 기재

## 기본 원칙

1. **명확성**: 코드의 의도와 동작을 명확하게 설명
2. **일관성**: 프로젝트 전체에서 동일한 스타일 유지
3. **유용성**: 개발자가 실제로 필요한 정보 제공
4. **최신성**: 코드 변경 시 문서도 함께 업데이트

### 네이밍 원칙(Documentation)

- **보편적 용어 우선**: 특별한 설명 없이 이해 가능한 일반 용어를 사용합니다.
- **내부 은어 지양**: 팀 내부에서만 통하는 명칭은 문서에 사용하지 않습니다.
- **코드와 동기화**: 코드 네이밍과 문서 용어를 일치시킵니다. 이름 변경 시 문서/ToC 링크를 즉시 갱신합니다.
- **모호성 회피**: `index`처럼 문맥에 따라 다른 의미를 갖는 용어는 구체화합니다(예: `indexing`, `search-index`).

## 코드 주석 스타일

### TypeScript/JavaScript 주석 규칙

#### 1. 클래스 주석

```typescript
/**
 * mcp is a client for the MCP protocol.
 * mcp 도구를 한번 감싼 클래스로 mcp 도구의 기능을 확장합니다.
 */
export class Mcp extends EventEmitter {
  // ...
}
```

**규칙:**

- 클래스의 목적과 역할을 간결하게 설명
- 한국어 설명을 추가하여 이해도 향상
- JSDoc 형식 사용 (`/** */`)

#### 2. 인터페이스 주석

```typescript
/**
 * The chat session
 */
export interface ChatSession {
  /**
   * The id of the chat session
   */
  sessionId: string;

  /**
   * Append a message to the chat session
   * @param message - The message to append
   */
  appendMessage(message: Message): Promise<void>;
}
```

**규칙:**

- 인터페이스와 각 프로퍼티/메서드에 주석 추가
- 매개변수와 반환값에 대한 설명 포함
- `@param`, `@returns` 태그 활용

#### 3. 함수/메서드 주석

```typescript
/**
 * Get the history of the chat session
 * @param options - The options for the history
 * @returns The history of the chat session
 */
async getHistories(
  options?: CursorPagination
): Promise<CursorPaginationResult<Readonly<MessageHistory>>> {
  // ...
}
```

**규칙:**

- 함수의 목적과 동작 설명
- 모든 매개변수에 대한 설명
- 반환값에 대한 설명
- 예외 상황이 있다면 `@throws` 태그 사용

#### 4. 타입 별칭 주석

```typescript
/**
 * Message history with additional metadata
 */
export type MessageHistory = Message & {
  messageId: string;
  createdAt: Date;
  isCompressed?: boolean;
};
```

**규칙:**

- 타입의 용도와 구조 설명
- 복잡한 타입의 경우 사용 예시 포함

### 주석 작성 가이드라인

#### ✅ 좋은 주석 예시

```typescript
/**
 * Compresses chat messages to reduce memory usage while preserving context.
 * 채팅 메시지를 압축하여 메모리 사용량을 줄이면서 컨텍스트를 보존합니다.
 *
 * @param messages - Array of messages to compress
 * @returns Compression result including summary and statistics
 * @throws {Error} When compression fails due to invalid message format
 */
async compress(messages: MessageHistory[]): Promise<CompressionResult> {
  // ...
}
```

#### ❌ 피해야 할 주석 예시

```typescript
// get data
function getData() { ... }

// loop through items
for (const item of items) { ... }
```

## README 문서 구조

### 패키지 README 표준 구조

```markdown
# Package Name

Brief description of the package purpose.

## Folder Structure

[디렉토리 구조 설명]

## Core Concepts

[주요 개념들 설명]

## API Reference

[주요 클래스/인터페이스 설명]

## Usage Examples

[사용 예시]

## Building and Testing

[빌드 및 테스트 방법]
```

### 각 섹션별 작성 가이드

#### 1. Folder Structure

```markdown
## Folder Structure
```

src/
├── agent/ # Agent interfaces and default implementation
├── chat/ # Chat session APIs and file based storage
├── common/ # Utilities shared across the core
├── mcp/ # Model Context Protocol (MCP) client wrappers
└── preset/ # Preset definition

```

```

**규칙:**

- 트리 구조로 표현
- 각 폴더의 역할을 간단히 설명
- 중요한 파일들도 포함

#### 2. Core Concepts

```markdown
## Agents

The `agent` folder defines the basic interface for an agent and a simple implementation:

- **`agent.ts`** – Defines the `Agent` interface which has a single `run()` method.
- **`simple-agent.ts`** – Implements `Agent`. It communicates with an LLM through an `LlmBridge`.
```

**규칙:**

- 도메인별로 그룹화
- 주요 파일과 클래스 설명
- 관계성과 의존성 명시

#### 3. Usage Examples

```typescript
// 기본 사용법
const agent = new SimpleAgent(llmBridge, chatSession);
const result = await agent.run([userMessage]);

// 고급 사용법
const agent = new SimpleAgent(llmBridge, chatSession, {
  mcpRegistry: myMcpRegistry,
  compressStrategy: myCompressStrategy,
});
```

**규칙:**

- 기본 사용법부터 고급 사용법까지 단계별 제공
- 실제 동작하는 코드 예시
- 주요 옵션과 설정 방법 포함

## API 문서 작성

### 자동 생성 도구 활용

- **TypeDoc** 사용 권장
- JSDoc 주석을 기반으로 HTML 문서 생성
- CI/CD에서 자동 업데이트

### 수동 API 문서 구조

````markdown
## API Reference

### Classes

#### `Mcp`

MCP 프로토콜 클라이언트 래퍼 클래스

##### Constructor

```typescript
constructor(client: Client, transport: Transport, config: McpConfig)
```
````

##### Methods

###### `connect(): Promise<void>`

MCP 서버에 연결합니다.

**Returns:** `Promise<void>`

**Throws:** 연결 실패 시 `Error`

**Example:**

```typescript
await mcp.connect();
```

````

## 사용 예시 작성 가이드

### 1. 기본 사용 예시
```typescript
import { SimpleAgent, FileBasedChatSession } from '@agentos/core';

// 기본 설정
const chatSession = new FileBasedChatSession(sessionId, storageDir);
const agent = new SimpleAgent(llmBridge, chatSession);

// 메시지 전송
const messages = await agent.run([{
  role: 'user',
  content: 'Hello, world!'
}]);
````

### 2. 고급 사용 예시

```typescript
import { SimpleAgent, McpRegistry } from '@agentos/core';

// MCP 도구와 함께 사용
const mcpRegistry = new McpRegistry();
await mcpRegistry.register(mcpConfig);

const agent = new SimpleAgent(llmBridge, chatSession, {
  mcpRegistry,
  compressStrategy: new MyCompressStrategy(),
});
```

### 3. 에러 처리 예시

#### 계층별 에러 처리 원칙

- **Core/Library 계층**: `throw new Error()` 사용하여 에러를 상위로 전파
- **Application 계층**: 공통 에러 핸들링 로직 구현 및 방어 코드 작성

#### Core/Library 계층 에러 처리

```typescript
// Core 패키지 내부 - 에러를 throw하여 상위로 전파
export class Mcp extends EventEmitter {
  async connect(): Promise<void> {
    try {
      await this.client.connect(this.transport);
    } catch (error) {
      // 구체적인 에러 정보와 함께 상위로 전파
      throw new Error(`MCP 연결 실패: ${error.message}`);
    }
  }

  async invokeTool(tool: Tool): Promise<InvokeToolResult> {
    if (!this.isConnected()) {
      throw new Error('MCP 서버에 연결되지 않았습니다');
    }

    try {
      return await this.client.callTool(tool);
    } catch (error) {
      throw new Error(`도구 실행 실패 [${tool.name}]: ${error.message}`);
    }
  }
}
```

#### Application 계층 에러 처리

```typescript
// CLI/GUI 애플리케이션 - 공통 에러 핸들링 및 방어 코드
export class ChatApp {
  private async handleUserMessage(message: string): Promise<void> {
    try {
      const result = await this.agent.run([
        {
          role: 'user',
          content: message,
        },
      ]);

      this.displayMessages(result);
    } catch (error) {
      // 공통 에러 핸들링 로직
      this.handleError(error, '메시지 처리 중 오류가 발생했습니다');
    }
  }

  private handleError(error: unknown, userMessage: string): void {
    // 에러 로깅
    console.error('Application Error:', error);

    // 사용자에게 친화적인 메시지 표시
    this.displayError(userMessage);

    // 특정 에러 타입별 처리
    if (error instanceof Error) {
      if (error.message.includes('MCP 연결')) {
        this.showMcpReconnectOption();
      } else if (error.message.includes('도구 실행')) {
        this.showToolErrorRecovery();
      }
    }

    // 애플리케이션 종료 방지 - 계속 실행 가능한 상태 유지
    this.resetToSafeState();
  }

  private resetToSafeState(): void {
    // 안전한 상태로 복구
    this.clearCurrentOperation();
    this.enableUserInput();
  }
}
```

#### 에러 타입 정의 예시

```typescript
// 도메인별 에러 타입 정의
export class McpConnectionError extends Error {
  constructor(serverName: string, cause: string) {
    super(`MCP 서버 '${serverName}' 연결 실패: ${cause}`);
    this.name = 'McpConnectionError';
  }
}

export class ChatSessionError extends Error {
  constructor(sessionId: string, operation: string, cause: string) {
    super(`세션 '${sessionId}' ${operation} 실패: ${cause}`);
    this.name = 'ChatSessionError';
  }
}

// Core 계층에서 구체적인 에러 타입 사용
async connect(): Promise<void> {
  try {
    await this.client.connect(this.transport);
  } catch (error) {
    throw new McpConnectionError(this.config.name, error.message);
  }
}
```

## 문서 업데이트 규칙

### 1. 코드 변경 시 문서 업데이트

- 새로운 기능 추가 시 README와 API 문서 업데이트
- 인터페이스 변경 시 관련 문서 모두 수정
- 예시 코드가 여전히 동작하는지 확인

### 2. 문서 리뷰 체크리스트

- [ ] 코드 주석이 최신 상태인가?
- [ ] README의 사용 예시가 동작하는가?
- [ ] API 문서가 실제 구현과 일치하는가?
- [ ] 새로운 기능에 대한 설명이 포함되었는가?
- [ ] 한국어 설명이 적절히 포함되었는가?

### 3. 문서 품질 기준

- **정확성**: 코드와 문서가 일치해야 함
- **완전성**: 모든 공개 API에 대한 문서 제공
- **명확성**: 개발자가 쉽게 이해할 수 있어야 함
- **실용성**: 실제 사용 가능한 예시 제공

## 도구 및 자동화

### 1. 권장 도구

- **TypeDoc**: TypeScript API 문서 생성
- **ESLint**: 주석 스타일 검사
- **Prettier**: 코드 포맷팅
- **Jest**: 문서 예시 코드 테스트

### 2. 자동화 스크립트

```json
{
  "scripts": {
    "docs:generate": "typedoc --out docs/api src/index.ts",
    "docs:check": "eslint --ext .ts src/ --rule 'require-jsdoc: error'",
    "docs:test": "jest --testPathPattern=docs"
  }
}
```

### 3. CI/CD 통합

- Pull Request 시 문서 검사
- 릴리스 시 API 문서 자동 생성
- 문서 사이트 자동 배포

## 언어 사용 가이드

### 1. 기본 언어

- **코드 주석**: 영어 우선, 한국어 보조 설명
- **README**: 영어 작성
- **API 문서**: 영어 작성
- **사용 예시**: 영어 주석, 한국어 설명 가능

### 2. 한국어 사용 시점

- 복잡한 비즈니스 로직 설명
- 도메인 특화 개념 설명
- 한국 개발자를 위한 보조 설명

### 3. 용어 통일

- **Agent**: 에이전트 (일관된 용어 사용)
- **Session**: 세션
- **MCP**: Model Context Protocol (축약어 그대로 사용)
- **Chat**: 채팅 (문맥에 따라 선택)

### File: docs/40-process-policy/git-workflow.md

<!-- Source: docs/40-process-policy/git-workflow.md -->

# Git Workflow Guide

## 🎯 **브랜치 전략**

### **브랜치 명명 규칙**

```bash
# UX 기능 개발
feature/ux-command-palette
feature/ux-session-management
feature/ux-message-search

# 컴포넌트 개발
feature/component-fab-system
feature/component-settings-panel

# core 로직 개발
feature/redis-chat-session-storage
feature/new-

# 버그 수정
fix/chatapp-state-sync
fix/css-grid-layout

# 성능 최적화
perf/virtual-scrolling
perf/bundle-splitting

# 리팩터링
refactor/component-separation
refactor/state-management
```

### **브랜치 생성 및 작업**

````bash
# 1. 최신 main 브랜치로 전환
git checkout main
git pull origin main

# 2. 새 기능 브랜치 생성
git checkout -b feature/ux-command-palette

# 3. push 전 검증 (포맷 포함)
pnpm format      # Prettier 포맷 적용 — 변경분을 반드시 커밋에 포함!
pnpm lint        # 자동 수정(--fix) 포함해 실행 권장 (에러 0, 경고 최소화)
pnpm typecheck   # 타입 오류 없도록 보장
pnpm test        # 단위 테스트 통과 확인

# 4. 작업 완료 후 Pull Request 생성 - 절대 직접 병합 금지!
git push origin feature/ux-command-palette


# 5. GitHub에서 Pull Request 생성 (PR 템플릿 기반)

반드시: GitHub 웹 UI에서 PR을 생성하여 `.github/pull_request_template.md`가 자동 적용되도록 합니다. PR 본문은 반드시 "계획서(Plan) 기반"으로 작성합니다.

CLI를 사용할 경우에도 템플릿을 강제 적용해야 합니다. 생성 시 `--body-file .github/pull_request_template.md`를 사용하고, 본문을 계획서 중심으로 즉시 채워 넣습니다.

```bash
# 기본 PR 생성 (브라우저에서 템플릿 자동 적용)
gh pr create --title "Add Command Palette system" --web

# 또는 템플릿 파일을 본문으로 채우고 수정을 위해 브라우저 열기(필수)
gh pr create --title "Add Command Palette system" \
  --body-file .github/pull_request_template.md --web
````

# ⚠️ 중요: 절대 git merge 명령어 사용 금지!

# ⚠️ 모든 병합은 Pull Request를 통해서만!

````

## 📝 **TODO별 커밋 전략**

### **커밋 메시지 규칙**

```bash
# TODO 완료 시
✅ [TODO 1/5] Add Command Palette basic structure

# 중간 진행 시
🚧 [TODO 2/5] WIP: Implement keyboard shortcuts for Command Palette

# TODO 완료 시
✅ [TODO 2/5] Complete keyboard shortcut implementation

# 전체 기능 완료 시
🎉 [FEATURE] Complete Command Palette system implementation
````

### **실제 작업 예시**

```bash
# Command Palette 기능 개발 예시

# 1. 브랜치 생성
git checkout -b feature/ux-command-palette

# 2. TODO 1 완료 후 커밋
git add .
git commit -m "✅ [TODO 1/4] Add kbar library integration and basic setup"

# 3. TODO 2 완료 후 커밋
git add .
git commit -m "✅ [TODO 2/4] Implement command actions and keyboard shortcuts"

# 4. TODO 3 완료 후 커밋
git add .
git commit -m "✅ [TODO 3/4] Add command categories and search functionality"

# 5. TODO 4 완료 후 커밋
git add .
git commit -m "✅ [TODO 4/4] Complete Command Palette integration with app state"

# 6. 기능 완료 커밋
git add .
git commit -m "🎉 [FEATURE] Complete Command Palette system implementation

- Cmd+K keyboard shortcut for instant access
- Categories: chat, settings, navigation, mcp
- Real-time search with fuzzy matching
- Context-aware command suggestions
- Integration with app state and navigation

Resolves: GUI_CYCLIC_UX_REDESIGN_PLAN.md Phase 1 Task 1"
```

## 🔄 **작업 흐름**

### **새 기능 시작 시**

1. **계획서 확인**: 해당 `GUI_*_PLAN.md` 문서의 TODO 리스트 검토
2. **브랜치 생성**: 기능명에 맞는 브랜치 생성
3. **TODO 단위 작업**: 각 TODO 완료 시마다 커밋
4. **테스트 실행**: `pnpm lint` && `pnpm test` 통과 확인
5. **문서 업데이트**: 완료된 TODO 체크 후 커밋
   - Plan→Docs 승격을 PR 생성 전에 완료합니다. 승격된 문서 경로를 PR 본문에 기재하세요.
6. **Pull Request 생성**: PR 템플릿 기반으로 생성하고, 본문은 "Plan 중심 요약"으로 작성
   - Context: Plan 링크(`plan/<file>.md` 또는 승격 후 `docs/<file>.md`), Scope
   - Docs: Plan→Docs 승격이 완료되었는지 확인(필수). 경로를 명시하세요.
   - Requirements: 계획서의 성공조건 요약(3~5줄)
   - TODO Status: 계획서의 TODO 목록 복사 + 완료 체크 표시
   - Changes: 핵심 변경사항 불릿(3~7개)
   - Verification: `pnpm -r typecheck | test | build` 결과 요약
   - Docs: Plan→Docs 승격 여부/경로, 기존 유사 문서 병합/확장 여부
   - PR 유형별 문서 원칙:
     - Feature/Fix: 변경된 인터페이스/동작에 맞게 기존 문서를 반드시 갱신
     - Refactor/Perf/Chore: 외부 인터페이스 변화가 없으면 문서 갱신 생략 가능(Plan만 삭제). 변화가 있다면 문서 갱신 필수
   - Risks/Notes: 브레이킹/제약/후속작업
   - 길고 일반적인 가이드 복붙은 금지. 반드시 계획서 준수/검증 중심으로 작성
7. **브랜치 유지**: PR 승인까지 브랜치 절대 삭제 금지

## 🚨 **절대 금지 사항**

### **❌ 직접 병합 금지**

```bash
# ❌ 절대 사용 금지 명령어들
git checkout main
git merge feature/branch-name  # 절대 금지!
git push origin main           # 절대 금지!
git branch -d feature/branch   # PR 승인 전 절대 금지!
```

### **✅ 올바른 완료 프로세스**

```bash
# 1. 브랜치에서 작업 완료
git push origin feature/branch-name

# 2. Pull Request 생성 (PR 템플릿 기반, Plan 중심 작성)
gh pr create --web

# 3. PR 승인까지 대기 (브랜치 유지)
# 4. 승인 후 GitHub에서 Merge
# 5. 그 후에만 로컬 브랜치 정리
```

### **코드 리뷰 기준**

- **브랜치별 리뷰**: 전체 기능 단위로 종합 검토
- **커밋별 리뷰**: TODO 단위의 세부 변경사항 검토
- **문서 동기화**: 계획서의 TODO 체크와 실제 구현 일치 확인
- **Plan→Docs 승격**: 모든 TODO 완료 시(= PR 생성 전) `plan/` 문서를 `docs/`로 승격하고 원본 삭제(Deprecated 디렉토리 금지). 유사 문서는 병합/확장.
- **Interface-first 문서**: 최종 문서는 인터페이스/계약/시나리오를 우선하며, 내부 구현 세부는 문서 대상이 아님.

> Tip
> CI 가드(선택): PR 본문에 Plan 링크가 없거나, `FEATURE` 커밋이 있는데 `plan/` 파일이 남아있는 경우 실패하도록 GitHub Actions/Danger로 검증하는 것을 권장합니다.

## 📊 **품질 관리**

### **커밋 전 체크리스트**

```bash
# 자동화된 체크
pnpm lint      # 코드 스타일 검증 (자동 수정 적용 시 변경 파일 반드시 커밋)
pnpm typecheck # 타입 오류 검증
pnpm test      # 단위 테스트 실행
pnpm build     # 빌드 오류 확인
```

> Note
>
> - `pnpm format` → `git status` → 변경 사항을 반드시 스테이지/커밋하세요. 포맷 변경이 누락되면 PR에서 불일치가 발생합니다.
> - `pnpm lint --fix` 실행 후에도 변경 파일 여부를 `git status`로 확인하고, 포맷과 함께 커밋에 포함합니다.
> - 린트 에러/경고로 인한 의미 없는 잡음 방지를 위해, 자동 수정으로 해결 가능한 항목은 즉시 반영하고 커밋합니다.

### **권장 자동화(선택)**

- pre-commit 훅으로 `pnpm format && pnpm lint`를 실행하여 포맷 누락을 방지합니다.(husky 등)
- CI에서 PR에 포맷/린트 오류가 있으면 실패하도록 Guard를 추가합니다.

### **GUI 테스트 정책 (Playwright E2E)**

- GUI(Electron/Web) 기능 검증은 Playwright 테스트(`pnpm --filter @agentos/apps-gui test:e2e`)로 수행합니다.
- 실행 절차:
  - `cd apps/gui && pnpm --filter @agentos/apps-gui test:e2e` 로 시나리오 검증
  - 필요 시 `pnpm dev:web`으로 서버를 띄우고 `playwright test --ui` 등 표준 도구를 사용해 디버깅합니다.
- 세부 시나리오는 `apps/gui/e2e/` 디렉터리를 참고해 관리합니다.

# 수동 체크

- [ ] TODO 항목이 완전히 완료되었는가?
- [ ] 관련 문서가 업데이트되었는가?
- [ ] 다른 기능에 영향을 주지 않는가?

### **Pull Request 생성 전 체크리스트**

- [ ] 모든 TODO가 완료되었는가?
- [ ] 계획서의 성공 조건을 만족하는가?
- [ ] 통합 테스트가 통과하는가?
- [ ] 문서가 최신 상태로 업데이트되었는가?
- [ ] 브랜치가 원격에 푸시되었는가?
- [ ] PR 제목과 설명이 명확한가?

### **Pre-push 품질 체크(권장)**

```bash
pnpm -r typecheck
pnpm -r lint -- --max-warnings=0
npx ts-prune  # dead export 확인
```

### **리뷰 체크리스트(요약)**

- [ ] any 사용 없음(unknown + 타입가드/제네릭/Adapter로 대체)
- [ ] dead code/미사용 export 없음(ts-prune/ESLint)
- [ ] 컨테이너/프레젠테이션 분리(프레젠테이션은 동기 props만)
- [ ] IPC fetcher는 ServiceContainer + Protocol만 호출하며 DTO 매핑 수행
- [ ] React Query queryKey 표준 사용 및 invalidate 일관성

### **Pull Request 승인 대기 중 체크리스트**

- [ ] 브랜치를 삭제하지 않았는가?
- [ ] main 브랜치로 전환하지 않았는가?
- [ ] 추가 수정사항이 있다면 같은 브랜치에 커밋했는가?

## 🚀 **필수 Git Hooks 설정 (CI 실패 방지)**

### **⚡ 자동 설정 스크립트**

```bash
# 프로젝트 루트에서 실행 - 모든 필수 hooks 한번에 설정
./.scripts/setup-git-hooks.sh
```

### **🔧 수동 Git Hooks 설정**

#### **1. pre-push hook (🚨 필수 - CI 실패 방지)**

```bash
#!/bin/sh
# .git/hooks/pre-push
echo "🔍 Running pre-push checks..."

# 1. 포맷팅 검사 및 자동 수정
echo "📝 Running formatter..."
pnpm format
if [ $? -ne 0 ]; then
    echo "❌ Format failed. Please fix formatting issues."
    exit 1
fi

# 2. 린트 검사
echo "🔍 Running linter..."
pnpm lint
if [ $? -ne 0 ]; then
    echo "❌ Lint failed. Please fix linting issues before pushing."
    exit 1
fi

# 3. 타입 체크
echo "🔧 Running type check..."
pnpm typecheck
if [ $? -ne 0 ]; then
    echo "❌ Type check failed. Please fix type errors before pushing."
    exit 1
fi

# 4. 테스트 실행 (선택적)
echo "🧪 Running tests..."
pnpm test
if [ $? -ne 0 ]; then
    echo "⚠️  Some tests failed. Consider fixing before pushing."
    # 테스트 실패는 경고만 (exit 하지 않음)
fi

# 5. 빌드 검증
echo "🏗️  Running build..."
pnpm build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before pushing."
    exit 1
fi

echo "✅ All pre-push checks passed!"
```

#### **2. pre-commit hook (권장)**

```bash
#!/bin/sh
# .git/hooks/pre-commit
echo "🔍 Running pre-commit checks..."

# 스테이징된 파일만 검사
pnpm lint-staged
if [ $? -ne 0 ]; then
    echo "❌ Lint-staged failed. Please fix issues and re-add files."
    exit 1
fi

echo "✅ Pre-commit checks passed!"
```

### **커밋 템플릿**

```bash
# .gitmessage
# 📋 [TODO x/y] 간단한 설명
#
# 상세 설명:
# - 구현된 기능
# - 변경된 파일들
# - 테스트 결과
#
# 관련 문서: GUI_*_PLAN.md
```

---

## 💡 **핵심 원칙**

1. **작은 단위, 자주 커밋**: TODO별로 명확한 진행상황 추적
2. **의미있는 커밋 메시지**: 나중에 히스토리를 추적하기 쉽게
3. **문서와 코드 동기화**: 계획서의 TODO와 실제 구현 일치
4. **품질 우선**: 각 단계에서 테스트와 린트 통과 필수
5. **🚨 Pull Request Only**: 모든 병합은 반드시 Pull Request를 통해서만
6. **🚨 브랜치 보호**: PR 승인 전까지 브랜치 절대 삭제 금지

### **📋 Git Hooks 설치 방법**

#### **자동 설치 (권장)**

```bash
# 프로젝트 루트에서 한 번만 실행
./.scripts/setup-git-hooks.sh
```

#### **수동 설치**

1. 위의 pre-push hook 스크립트를 `.git/hooks/pre-push`에 저장
2. 실행 권한 부여: `chmod +x .git/hooks/pre-push`
3. pre-commit hook도 동일하게 설정

### **🎯 Hook 동작 방식**

**Pre-push Hook가 실행하는 검사:**

1. **포맷팅**: `pnpm format` (자동 수정 + 커밋 요구)
2. **린트**: `pnpm lint` (실패 시 push 차단)
3. **타입체크**: `pnpm typecheck` (실패 시 push 차단)
4. **빌드**: `pnpm build` (실패 시 push 차단)
5. **테스트**: `pnpm test` (실패 시 경고만)
6. **브랜치 보호**: main 브랜치 직접 push 차단

**실패 시 대응 방법:**

```bash
# 1. 린트 에러 자동 수정 시도
pnpm lint --fix

# 2. 포맷팅 자동 수정 후 커밋
pnpm format
git add .
git commit --amend --no-edit

# 3. 타입 에러는 수동으로 수정 필요
pnpm typecheck

# 4. 급한 경우 hook 우회 (비권장)
git push --no-verify
```

## ⚠️ ** Coding Agent 사용 시 필수 지침**

### **🔧 Coding Agent 작업 전 확인사항**

**✅ Coding Agent 가 반드시 해야 할 작업:**

1. **브랜치 생성**: `git checkout -b feature/descriptive-name`
2. **품질 검사**: 모든 변경 후 `pnpm lint && pnpm typecheck && pnpm build`
3. **TODO별 커밋**: 각 TODO 완료 시마다 의미있는 커밋
4. **Hook 통과 확인**: push 전 pre-push hook 성공 확인
5. **PR 생성**: `gh pr create`로 Pull Request 생성

**❌ Coding Agent 가 절대 해서는 안 되는 작업:**

1. `git merge` 명령어 실행
2. `git checkout main` 후 병합 작업
3. `git branch -d` 로 브랜치 삭제 (PR 승인 전)
4. `git push origin main` 직접 푸시
5. `git push --no-verify` Hook 우회 푸시
6. Lint/타입 에러 무시하고 진행

### **🚨 실패 시 대응 절차**

```bash
# 1. 문제 파악
echo "Hook failed - checking issues..."

# 2. 자동 수정 시도
pnpm lint --fix
pnpm format

# 3. 변경사항 커밋
git add .
git commit --amend --no-edit

# 4. 타입 에러 수정 (수동)
pnpm typecheck
# 에러 수정 후
git add .
git commit --amend --no-edit

# 5. 재시도
git push origin feature-branch
```

### **💡 품질 보장 체크리스트**

모든 커밋 전:

- [ ] `pnpm lint` 통과
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm build` 통과
- [ ] 의미있는 커밋 메시지 작성
- [ ] TODO별 단위 커밋 확인

Push 전:

- [ ] Pre-push hook 성공
- [ ] 브랜치명이 적절한가
- [ ] main 브랜치가 아닌가
- [ ] PR 준비 완료

**이 지침을 통해 CI 실패 없는 안전하고 품질 높은 개발을 보장합니다.**

### File: docs/40-process-policy/plan-maintenance.md

<!-- Source: docs/40-process-policy/plan-maintenance.md -->

# Plan Maintenance Guide

거대한 기능이나 중장기 작업은 `plan/` 디렉터리에 계획서를 두고 관리합니다. 이 문서는 계획서의 작성→수정→완료→아카이브 흐름을 명확히 하여, 최신 상태만이 `plan/`에 남도록 하기 위한 지침입니다.

## 1. 작성 원칙

- **생성 시점**: 새 기능/리팩터링/통합 작업을 시작하기 전, 관련 팀 합의가 끝나면 작성합니다.
- **템플릿**: `docs/90-templates/PLAN_TEMPLATE.md`를 기반으로 작성하며, 최소 필수 섹션(Requirements, Interface Sketch, Todo, 작업 순서)을 채웁니다.
- **상태 메타데이터**: 문서 상단에 `Last Updated`와 작성자, 현재 상태(`Draft` / `In Progress` / `Completed`)를 기재합니다.
- **브랜치 전략**: 계획서에 명시된 브랜치 전략을 따르며, 모든 구현 PR은 해당 전략 하위 브랜치에서 진행합니다.

## 2. 운영 규칙

- **단일 사실 근거(SSOT)**: 진행 중인 요구사항/기술 결정을 합의 후 계획서에 반영합니다. 구두 전달이나 슬랙 논의는 반드시 문서로 정리합니다.
- **체크박스 관리**: Todo나 성공 조건이 완료되면 즉시 체크하고, 관련 PR/커밋 ID를 인라인 메모나 각주로 남깁니다.
- **테스트/문서 반영**: 계획서에서 언급한 테스트/문서 변경은 PR마다 검증하여, 계획서 내용을 따라가면 구현 상태를 재현할 수 있도록 합니다.
- **리뷰 주기**: 장기 과제는 최소 주 1회 담당자가 계획서를 검토해 상태를 업데이트합니다(예: `In Progress` → `Completed`).

## 3. 완료 및 승격

- **완료 조건**: 성공 조건과 Todo가 모두 체크되고, 검증(테스트/QA/문서)이 마무리되면 `Completed`로 상태를 변경합니다.
- **승격 처리**: 완료된 계획서는 요약과 핵심 결론을 1~2 페이지로 정리해 `docs/` 트리에 맞는 위치로 이동합니다. 예) GUI 기능 → `docs/30-developer-guides/`, Core 설계 → `docs/10-architecture/`.
- **plan/ 디렉터리 정리**: 승격 후 `plan/`에서는 원본을 제거하여 진행 중 문서만 남깁니다. 필요 시 `docs/` 측에서 “이전 계획” 섹션에 링크를 추가합니다.

## 4. 폐기/중단 처리

- 계획이 더 이상 유효하지 않다면 `Status: Deprecated`로 명시하고, 폐기 사유와 참고 링크(대체 안건 등)를 기록합니다.
- Deprecated 문서는 1주일 후(또는 합의된 시점) 완전히 삭제합니다. 필요한 경우 관련 정보는 회고 문서나 `docs/`의 히스토리 섹션에 옮깁니다.

## 5. 점검 루틴

- **월간 감시**: 팀별로 월 1회 `plan/` 디렉터리를 훑어 `Completed`/`Deprecated` 상태를 승격 또는 아카이브합니다.
- **PR Checklist**: 대규모 기능 PR은 해당 계획서에 링크를 추가하고, 계획서 체크리스트가 최신인지 확인합니다.
- **문서 링크 무결성**: 계획서를 이동/삭제할 때, 관련 문서와 README에서 링크를 업데이트합니다. `pnpm --filter @agentos/docs link:check`와 같은 검증 스크립트가 있다면 실행합니다.

## 6. 베스트 프랙티스

- 계획서 작성자는 구현을 마칠 때까지 “문서 오너”로 남습니다. 이관이 필요하면 명시적으로 적고 인수인계합니다.
- 복잡도가 높거나 Core 변경이 필요한 작업은 계획서에 “선행 조건” 섹션을 두어 다른 팀과의 인터페이스를 명확히 합니다.
- Progress 노트를 짧게라도 남기면(예: 변경 히스토리 표), 이후 스프린트 리뷰나 회고에 활용하기 쉽습니다.

이 지침을 통해 `plan/` 디렉터리가 항상 현재 진행 중인 작업만을 반영하도록 유지하고, 완료된 지식은 `docs/`로 승격하여 공유도를 높이세요.

### File: docs/40-process-policy/plan-promotion.md

<!-- Source: docs/40-process-policy/plan-promotion.md -->

# Plan → Docs 승격 가이드

> 이 문서는 plan/ 문서를 작업 완료 시 docs/로 승격(Promote)하는 표준 절차입니다. Git 워크플로우와 문서 표준을 함께 따릅니다.

## 원칙

- 단순함 우선: 완료된 TODO가 반영된 최소 충분 문서만 승격합니다.
- Interface-first: 최종 문서는 인터페이스/계약/시나리오 중심으로 정리합니다. 내부 구현 세부는 과도하게 담지 않습니다.
- 일관성: 문서 위치/링크/명명 규칙을 기존 docs/와 일치시킵니다.

## 언제 승격하나요?

- 계획서의 TODO가 모두 완료되고 테스트/타입체크/빌드가 통과할 때
- PR 생성 전에 승격을 완료해야 합니다.(PR 본문에는 승격된 Docs 경로를 기재)
- 변경된 인터페이스가 기존 문서와 충돌하지 않도록 조정이 끝났을 때

## 표준 절차

1. 최종 점검

- plan 문서의 요구사항, 인터페이스, 성공 기준(AC), TODO 체크 상태를 다시 검토합니다.
- 테스트 결과(`pnpm -r test`), 타입체크(`pnpm -r typecheck`), 빌드(`pnpm -r build`)를 확인합니다.

2. 문서 구조 결정

- 공통 지침/철학/가이드: 루트 `docs/` 아래에 배치합니다.
- 특정 패키지 기능 설명/사용자 가이드: 해당 패키지 `packages/<name>/docs/` 아래에 배치합니다.

3. 승격(프로모션)

- 문서명을 최종 사용자 관점으로 재정의합니다. (예: `GRAPH_RAG_PLAN.md` → `Personalized_Memory_Guide.md`)
- 계획서의 작업 내역/실험로그 등은 요약하여 “결과/결론” 위주로 재구성합니다.
- 인터페이스/타입/메서드 시그니처, 설정 예시, 사용 시나리오, AC 검증 방법을 포함합니다.
- 기존 관련 문서가 있으면 병합/확장하고, 중복은 제거합니다.

4. 파일 이동 및 정리

- `git mv packages/<scope>/plan/<file>.md <docs-target>/<NewName>.md`
- 계획서의 TODO/실험 섹션은 필요 시 별도 `notes/`로 분리하거나 PR 본문에만 남깁니다.
- 승격 후 같은 PR에서 plan 파일을 반드시 삭제합니다(SSOT: 단일 진실 소스 유지).

5. 커밋/PR 생성

- 커밋 메시지 예시:
  - `✅ [Plan→Docs] Promote GRAPH_RAG plan to docs with finalized interfaces`
- PR 본문은 아래를 포함해야 합니다.
  - Plan 링크와 요약, Scope
  - 승격된 Docs 경로(필수): `docs/...` 또는 `packages/<name>/docs/...`
  - 성공 조건(AC) 충족 근거 요약(3–5줄)
  - TODO 상태 체크(완료/보류)
  - 변경 사항 요약(3–7개 불릿)
  - 검증: `pnpm -r typecheck | test | build` 결과
  - Docs 업데이트 경로 및 기존 유사 문서 처리 방식

## 체크리스트

- [ ] TODO 전부 완료했는가?
- [ ] 인터페이스/타입/설정 값이 최신 코드와 일치하는가?
- [ ] 예제/가이드가 실제로 실행 가능한가?
- [ ] 기존 문서와 중복/충돌이 없는가?
- [ ] PII/내부 정보 노출이 없는가?

## 예시(경로/명명)

- Plan: `packages/core/plan/GRAPH_RAG_PLAN.md`
- Docs(공유 가이드): `docs/personalized-memory.md`
- Docs(패키지 가이드): `docs/packages/core/memory-api.md`

## 관련 문서

- Git Workflow: `docs/GIT_WORKFLOW_GUIDE.md`
- 문서 표준: `docs/DOCUMENTATION_STANDARDS.md`
- 테스트: `docs/30-developer-guides/testing.md`
- 타입 지침: `docs/30-developer-guides/typescript-typing-guidelines.md`

## 주의

- 직접 병합 금지. 반드시 PR로 리뷰/승인 후 머지합니다.
- Plan→Docs 승격은 PR 생성 전 완료되어야 하며, PR 검토 항목에 포함됩니다.
- 승격 과정에서 Plan과 Docs의 내용이 불일치하지 않도록 마지막에 상호 참조를 제거하고, Docs만 단일 진실 소스로 남깁니다.
- (권장) CI/Danger 가드: FEATURE/Docs 변경이 있는 PR에서 `plan/` 파일이 남아있거나, 동일 주제를 Plan/Docs 양쪽이 중복 기술하는 경우 실패 처리합니다.

### File: docs/40-process-policy/README.md

<!-- Source: docs/40-process-policy/README.md -->

# Process & Policy (Overview)

- Docs & Plan Policy (SSOT): `./docs-policy.md`
- Documentation Standards: `./documentation-standards.md`
- Git Workflow: `./git-workflow.md`
- Plan Promotion Guide: `./plan-promotion.md`

프로세스/정책/기여 지침의 허브입니다.

### File: docs/40-process-policy/testing-compat-guidelines.md

<!-- Source: docs/40-process-policy/testing-compat-guidelines.md -->

# Testing/Tooling Compatibility Guidelines

> Purpose: Prevent regressions when introducing or upgrading testing libraries and runtime tooling. Changes MUST be compatible with existing suites or provide a safe migration strategy.

## When adding/changing libraries

- Analyze impact across these layers before the first commit:
  - Runner & environment: node, jsdom, electron, playwright.
  - Global setup: `expect` extensions, globals, polyfills.
  - Module resolution & formats: CJS/ESM, tsconfig `moduleResolution`, bundler settings.
  - Lint & TS rules: test-only relaxations, type boundaries.
- Produce a brief “compat report” in the PR description:
  - What’s added/changed, default behaviors, and expected side-effects.
  - Discovery of conflicts (e.g., `@testing-library/jest-dom` extending global `expect`).
  - Scoping strategy (opt-in patterns or separate configs) and rollback plan.

## Mandatory scoping & safety

- Scope new env/setup to the minimal surface:
  - Use a package-local Vitest config (e.g., `apps/gui/vitest.config.ts`).
  - Keep `setupFiles` as small as possible. Prefer `@testing-library/jest-dom/vitest` over the global entry.
  - Do NOT modify workspace-wide test runner behavior without a migration.
- Split suites by type where needed:
  - `unit` (node / jsdom), `e2e` (playwright), `legacy` (node-only). Provide separate scripts.
  - Start with opt-in inclusion patterns; expand once green.

## Rollback protocol

- If compatibility fixes exceed the time budget, roll back the library change and keep tests green.
- Alternatives:
  - Keep existing runner and add a targeted helper (e.g., `react-test-renderer`) for UI spots.
  - Gate new framework usage behind an opt-in script.

## PR checklist (must-have)

- [ ] Impacted packages and suites enumerated
- [ ] Env/setup scoping described (config file, include patterns)
- [ ] Fallback/rollback steps documented
- [ ] Local run evidence: `lint`, `typecheck`, `test` (with suite names), `build`

_Included files: 7_
