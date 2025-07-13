# Testing Guide

Unit tests use **Jest** with `ts-jest`. Test files live under `__tests__` directories.

Run all tests from the repository root:

```bash
pnpm test
```

For watch mode during development:

```bash
pnpm dev
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

## Unit Test Guidelines

### 1. 기본 규칙

- Test files must end with `.test.ts`
- Test files live under `__tests__` directories
- Use **Jest** with `ts-jest` configuration
- Use **jest-mock-extended** for creating type-safe mocks
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
import { mock, MockProxy } from 'jest-mock-extended';

describe('Mcp', () => {
  let mockClient: MockProxy<Client>;
  let mockTransport: MockProxy<Transport>;
  let mcp: Mcp;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock client using jest-mock-extended
    mockClient = mock<Client>();

    // Setup mock transport using jest-mock-extended
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
import { MockProxy } from 'jest-mock-extended';

jest.mock('fs/promises');
const mockFs = fs as MockProxy<typeof fs>;

describe('FileBasedChatSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should execute callback after specified time', () => {
    const mockCallback = jest.fn();
    const scheduler = new Scheduler();

    scheduler.schedule(mockCallback, 1000);

    expect(mockCallback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
```

#### 네트워크 통신 mocking

```typescript
// packages/core/src/mcp/__tests__/mcp-transport.test.ts
import fetch from 'node-fetch';
import { MockProxy } from 'jest-mock-extended';

jest.mock('node-fetch');
const mockFetch = fetch as MockProxy<typeof fetch>;

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

#### 일반 테스트 체크리스트

- [ ] 테스트가 결정적으로 동작함
- [ ] 테스트 간 격리가 보장됨
- [ ] 의미 있는 테스트 이름 사용
- [ ] Given-When-Then 패턴 적용

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
- **타이밍 이슈**: jest.useFakeTimers() 사용

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
