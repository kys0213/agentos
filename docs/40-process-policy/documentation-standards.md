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
