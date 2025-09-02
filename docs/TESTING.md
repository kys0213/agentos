# Testing Guide

Unit tests use **Vitest**. Test files live under `__tests__` directories.

Run all tests from the repository root:

```bash
pnpm -r test
```

For watch mode during development:

```bash
pnpm -r test:watch
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
└── agent-slack-bot/ # 슬랙봇 애플리케이션
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
  let mockDependency: Dependency;

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
- Use **Vitest** with per-package `vitest.config.ts`
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
import { vi } from 'vitest';

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
pnpm -r test:watch

# 커버리지 포함
vitest run --coverage
```

### 2. CI/CD 파이프라인

```bash
# 코어 모듈 100% 커버리지 검증
vitest run --coverage

# 병렬 테스트 실행
pnpm -r test
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
