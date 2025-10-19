# Unit Test Convention

## 적용 대상

- `packages/core/src/common/*` - 순수함수, 유틸리티 (100% 커버리지)
- `packages/core/src/*` - 도메인 로직 (Mock 활용, 90%+ 커버리지)
- `packages/lang/src/*` - 언어 유틸리티 (100% 커버리지)
- `apps/*/src/*` - 응용 계층 (통합 테스트)

## 테스트 철학

### 코어 모듈 (Core Modules)

**순수함수 또는 단일책임원칙 기반 컴포넌트**

- **100% 테스트 커버리지 필수**
- 모든 엣지 케이스와 에러 시나리오 커버
- 외부 의존성 없음 (또는 최소화)

### 도메인 모듈 (Domain Modules)

**비즈니스 로직을 포함한 서비스/컨트롤러**

- **블랙박스 테스트**: 내부 구현이 아닌 공개 API 테스트
- **외부 의존성 Mock 필수**: Repository, Service, Client 등
- **90%+ 커버리지 목표**

## Template 1: 순수함수 (Pure Functions)

**위치**: `packages/core/src/common/`, `packages/lang/src/`

```typescript
// packages/core/src/common/utils/__tests__/parseJson.test.ts
import { describe, it, expect } from 'vitest';
import { parseJson } from '../parseJson';

describe('parseJson', () => {
  it('should parse valid JSON string', () => {
    // Given
    const input = '{"key": "value"}';

    // When
    const result = parseJson(input);

    // Then
    expect(result).toEqual({ key: 'value' });
  });

  it('should return null for invalid JSON', () => {
    // Given
    const input = 'invalid json';

    // When
    const result = parseJson(input);

    // Then
    expect(result).toBeNull();
  });

  it('should handle null input', () => {
    // Given
    const input = null;

    // When
    const result = parseJson(input);

    // Then
    expect(result).toBeNull();
  });

  it('should handle undefined input', () => {
    // Given
    const input = undefined;

    // When
    const result = parseJson(input);

    // Then
    expect(result).toBeNull();
  });

  it('should handle empty string', () => {
    // Given
    const input = '';

    // When
    const result = parseJson(input);

    // Then
    expect(result).toBeNull();
  });

  it('should parse complex nested objects', () => {
    // Given
    const input = '{"nested": {"key": [1, 2, 3]}}';

    // When
    const result = parseJson(input);

    // Then
    expect(result).toEqual({ nested: { key: [1, 2, 3] } });
  });
});
```

### 순수함수 테스트 체크리스트

- [ ] 정상 입력 케이스
- [ ] `null` 입력 처리
- [ ] `undefined` 입력 처리
- [ ] 빈 문자열/배열/객체 처리
- [ ] 경계값 테스트
- [ ] 예외 발생 케이스
- [ ] 100% 커버리지 확인

## Template 2: 도메인 모듈 (with Mocks)

**위치**: `packages/core/src/*/`

### 기본 구조

```typescript
// packages/core/src/tool/mcp/registry/__tests__/mcp-metadata-registry.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, type MockProxy } from 'vitest-mock-extended';
import { McpMetadataRegistry } from '../mcp-metadata-registry';
import { McpRegistry } from '../../mcp-registry';
import type { McpConfig } from '../../mcp-config';
import { MockMcpToolRepository } from './fixture';

describe('McpMetadataRegistry', () => {
  let registry: McpMetadataRegistry;
  let mockRepository: MockMcpToolRepository;
  let mockMcpRegistry: MockProxy<McpRegistry>;

  beforeEach(async () => {
    // Mock 초기화
    vi.clearAllMocks();
    mockMcpRegistry = mock<McpRegistry>();
    mockRepository = new MockMcpToolRepository();

    // 테스트 대상 생성
    registry = new McpMetadataRegistry(mockRepository, mockMcpRegistry);
    await registry.initialize();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      // Given
      const newRegistry = new McpMetadataRegistry(mockRepository, mockMcpRegistry);

      // When & Then
      await expect(newRegistry.initialize()).resolves.toBeUndefined();
    });

    it('should load existing tools from repository', async () => {
      // Given
      const config: McpConfig = {
        type: 'stdio',
        name: 'existing-tool',
        version: '1.0.0',
        command: 'node',
      };
      await mockRepository.create(config);

      // When
      const newRegistry = new McpMetadataRegistry(mockRepository, mockMcpRegistry);
      await newRegistry.initialize();

      // Then
      expect(newRegistry.totalToolsCount).toBe(1);
    });
  });

  describe('tool registration', () => {
    it('should register tool successfully', async () => {
      // Given
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };
      mockMcpRegistry.register.mockResolvedValue(undefined);

      // When
      await registry.registerTool(config);

      // Then
      expect(registry.totalToolsCount).toBe(1);
      expect(mockMcpRegistry.register).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-tool',
          type: 'stdio',
        })
      );
    });

    it('should handle registration failure gracefully', async () => {
      // Given
      const config: McpConfig = {
        type: 'stdio',
        name: 'failing-tool',
        version: '1.0.0',
        command: 'node',
      };
      mockMcpRegistry.register.mockRejectedValue(new Error('Connection failed'));

      // When
      await expect(registry.registerTool(config)).rejects.toThrow('Connection failed');

      // Then
      expect(registry.totalToolsCount).toBe(1); // 메타데이터는 저장됨
      const tools = registry.getAllTools().items;
      expect(tools[0].status).toBe('error'); // 상태는 error
    });
  });

  describe('event emission', () => {
    it('should emit toolAdded event on registration', async () => {
      // Given
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };
      mockMcpRegistry.register.mockResolvedValue(undefined);

      const eventPromise = new Promise((resolve) => {
        registry.on('toolAdded', resolve);
      });

      // When
      await registry.registerTool(config);
      const event = await eventPromise;

      // Then
      expect(event).toHaveProperty('tool');
      expect(event.tool).toEqual(
        expect.objectContaining({
          name: 'test-tool',
        })
      );
    });
  });
});
```

### 도메인 모듈 테스트 체크리스트

- [ ] 외부 의존성이 모두 Mock됨
- [ ] 성공 시나리오 테스트
- [ ] 에러 처리 시나리오 테스트
- [ ] 이벤트 발생 검증 (해당하는 경우)
- [ ] Mock 호출 파라미터 검증
- [ ] 상태 변경 검증
- [ ] 비즈니스 로직만 테스트 (내부 구현 X)

## Template 3: 비동기 처리

```typescript
describe('AsyncService', () => {
  let service: AsyncService;
  let mockRepo: MockProxy<Repository>;

  beforeEach(() => {
    mockRepo = mock<Repository>();
    service = new AsyncService(mockRepo);
  });

  describe('async operations', () => {
    it('should handle successful async call', async () => {
      // Given
      const expectedData = { id: '123', value: 'test' };
      mockRepo.fetch.mockResolvedValue(expectedData);

      // When
      const result = await service.getData('123');

      // Then
      expect(result).toEqual(expectedData);
      expect(mockRepo.fetch).toHaveBeenCalledWith('123');
    });

    it('should handle async rejection', async () => {
      // Given
      const error = new Error('Network error');
      mockRepo.fetch.mockRejectedValue(error);

      // When & Then
      await expect(service.getData('123')).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      // Given
      vi.useFakeTimers();
      mockRepo.fetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({}), 5000))
      );

      // When
      const promise = service.getDataWithTimeout('123', 1000);
      vi.advanceTimersByTime(1000);

      // Then
      await expect(promise).rejects.toThrow('Timeout');

      vi.useRealTimers();
    });
  });
});
```

## Template 4: 이벤트 테스트

```typescript
describe('EventEmitter', () => {
  let emitter: CustomEventEmitter;

  beforeEach(() => {
    emitter = new CustomEventEmitter();
  });

  it('should emit events to subscribers', async () => {
    // Given
    const eventPromise = new Promise((resolve) => {
      emitter.on('dataChanged', resolve);
    });

    const expectedPayload = { id: '123', data: 'test' };

    // When
    emitter.emit('dataChanged', expectedPayload);
    const receivedPayload = await eventPromise;

    // Then
    expect(receivedPayload).toEqual(expectedPayload);
  });

  it('should support multiple subscribers', async () => {
    // Given
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    emitter.on('dataChanged', handler1);
    emitter.on('dataChanged', handler2);

    // When
    emitter.emit('dataChanged', { data: 'test' });

    // Then
    expect(handler1).toHaveBeenCalledWith({ data: 'test' });
    expect(handler2).toHaveBeenCalledWith({ data: 'test' });
  });

  it('should unsubscribe correctly', () => {
    // Given
    const handler = vi.fn();
    const unsubscribe = emitter.on('dataChanged', handler);

    // When
    unsubscribe();
    emitter.emit('dataChanged', { data: 'test' });

    // Then
    expect(handler).not.toHaveBeenCalled();
  });
});
```

## Mock 전략

### 1. vitest-mock-extended 사용

**인터페이스/타입 Mock**

```typescript
import { mock, type MockProxy } from 'vitest-mock-extended';

let mockService: MockProxy<ServiceInterface>;

beforeEach(() => {
  mockService = mock<ServiceInterface>();
});
```

### 2. Fixture 클래스 사용

**복잡한 Repository Mock**

```typescript
// __tests__/fixture.ts
export class MockMcpToolRepository implements McpToolRepository {
  private tools = new Map<string, McpToolMetadata>();
  private eventHandlers = new Map<string, EventHandler[]>();

  async create(config: McpConfig): Promise<McpToolMetadata> {
    const tool = {
      id: `tool-${Date.now()}`,
      ...config,
      status: 'active',
      createdAt: new Date(),
    };
    this.tools.set(tool.id, tool);
    this.emit('changed', { id: tool.id, metadata: tool });
    return tool;
  }

  async get(id: string): Promise<McpToolMetadata | null> {
    return this.tools.get(id) ?? null;
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

  private emit(event: string, payload: unknown): void {
    const handlers = this.eventHandlers.get(event) ?? [];
    handlers.forEach((handler) => handler(payload));
  }
}
```

**사용법**

```typescript
// mcp-registry.test.ts
import { MockMcpToolRepository } from './fixture';

describe('McpRegistry', () => {
  let mockRepo: MockMcpToolRepository;

  beforeEach(() => {
    mockRepo = new MockMcpToolRepository();
  });

  it('should use fixture', async () => {
    const config = { /* ... */ };
    const tool = await mockRepo.create(config);
    expect(tool.id).toBeDefined();
  });
});
```

### 3. 외부 모듈 Mock

```typescript
import { vi } from 'vitest';

// 모듈 전체 Mock
vi.mock('fs/promises');

// 특정 함수만 Mock
vi.mock('../utils', () => ({
  parseJson: vi.fn(),
  safeZone: vi.fn(),
}));
```

## 파일 시스템 테스트

```typescript
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

describe('FileBasedRepository', () => {
  let tmpDir: string;
  let repository: FileBasedRepository;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentos-test-'));
    repository = new FileBasedRepository(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should save data to file', async () => {
    // Given
    const data = { id: '123', value: 'test' };

    // When
    await repository.save('test.json', data);

    // Then
    const filePath = path.join(tmpDir, 'test.json');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(JSON.parse(content)).toEqual(data);
  });
});
```

## 시간 의존적 로직 테스트

```typescript
import { vi } from 'vitest';

describe('Scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute callback after delay', () => {
    // Given
    const callback = vi.fn();
    const scheduler = new Scheduler();

    // When
    scheduler.schedule(callback, 1000);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    // Then
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cancel scheduled task', () => {
    // Given
    const callback = vi.fn();
    const scheduler = new Scheduler();

    // When
    const task = scheduler.schedule(callback, 1000);
    task.cancel();
    vi.advanceTimersByTime(1000);

    // Then
    expect(callback).not.toHaveBeenCalled();
  });
});
```

## Assertion 패턴

### 객체 검증

```typescript
// 정확한 매칭
expect(result).toEqual({ id: '123', value: 'test' });

// 부분 매칭
expect(result).toEqual(
  expect.objectContaining({
    id: '123',
    // 다른 필드는 무시
  })
);

// 타입만 검증
expect(result).toEqual({
  id: expect.any(String),
  count: expect.any(Number),
  createdAt: expect.any(Date),
});
```

### 배열 검증

```typescript
// 정확한 매칭
expect(items).toEqual(['a', 'b', 'c']);

// 길이만 검증
expect(items).toHaveLength(3);

// 특정 요소 포함
expect(items).toContain('b');
expect(items).toContainEqual({ id: '123' });

// 배열 내 모든 요소가 조건 만족
expect(items).toEqual(expect.arrayContaining([expect.any(String)]));
```

### 함수 호출 검증

```typescript
// 호출 여부
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(3);

// 파라미터 검증
expect(mockFn).toHaveBeenCalledWith(
  'expected-param',
  expect.objectContaining({ key: 'value' }),
  undefined
);

// 마지막 호출 검증
expect(mockFn).toHaveBeenLastCalledWith('last-param');
```

## 테스트 실행

```bash
# 특정 파일만
pnpm test packages/core/src/tool/mcp/__tests__/mcp.test.ts

# 패키지 전체
pnpm --filter @agentos/core test

# 워치 모드
pnpm --filter @agentos/core test -- --watch

# 커버리지
pnpm --filter @agentos/core test -- --coverage
```

## 참고 문서

- [Fixture/Mock 작성 가이드](./fixture-mock.md)
- [Testing Guide](../../../docs/30-developer-guides/testing.md)
