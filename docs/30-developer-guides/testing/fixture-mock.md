# Fixture & Mock 작성 가이드

## 개요

테스트에서 외부 의존성을 제어하기 위한 Mock과 Fixture 작성 가이드입니다.

### Fixture vs Mock

| 구분 | Fixture | Mock |
|------|---------|------|
| 정의 | 완전한 구현체 (테스트용) | 동작을 시뮬레이션하는 객체 |
| 사용 대상 | Repository, Storage 등 상태를 가진 객체 | Service, Client 등 단순 인터페이스 |
| 복잡도 | 높음 (실제 동작 구현) | 낮음 (필요한 메서드만) |
| 재사용성 | 높음 (여러 테스트에서 공유) | 중간 (팩토리 함수로 생성) |
| 파일 위치 | `__tests__/fixture.ts` | 테스트 파일 내부 또는 팩토리 |

## Fixture 작성 (Repository Mock)

### 언제 Fixture를 만드나?

다음 조건에 해당하면 Fixture 클래스를 작성하세요:

- ✅ **상태 관리**가 필요한 경우 (Map, Array 등으로 데이터 저장)
- ✅ **이벤트 발생**이 필요한 경우 (EventEmitter 패턴)
- ✅ **여러 테스트에서 재사용**되는 경우
- ✅ **복잡한 비즈니스 로직**을 시뮬레이션해야 하는 경우

### Template: Repository Fixture

```typescript
// __tests__/fixture.ts
import {
  CursorPagination,
  CursorPaginationResult,
} from '../../../../common/pagination/cursor-pagination';
import { McpConfig } from '../../mcp-config';
import { McpToolMetadata } from '../../mcp-types';
import {
  McpToolRepository,
  McpToolRepositoryEventPayload,
} from '../../repository/mcp-tool-repository';

/**
 * Mock Repository for testing MCP Tool Registry
 *
 * Features:
 * - In-memory data storage
 * - Event emission (changed, deleted, statusChanged)
 * - Version conflict simulation
 */
export class MockMcpToolRepository implements McpToolRepository {
  private tools = new Map<string, McpToolMetadata>();
  private eventHandlers = new Map<
    string,
    ((payload: McpToolRepositoryEventPayload) => void)[]
  >();

  // Read operations
  async get(id: string): Promise<McpToolMetadata | null> {
    return this.tools.get(id) || null;
  }

  async list(_pagination?: CursorPagination): Promise<CursorPaginationResult<McpToolMetadata>> {
    const items = Array.from(this.tools.values());
    return {
      items,
      nextCursor: '',
      hasMore: false,
    };
  }

  async search(): Promise<CursorPaginationResult<McpToolMetadata>> {
    return this.list();
  }

  // Write operations
  async create(config: McpConfig): Promise<McpToolMetadata> {
    const tool: McpToolMetadata = {
      id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      description: `MCP Tool: ${config.name}`,
      version: config.version,
      category: 'general',
      provider: 'Test Provider',
      status: 'disconnected',
      usageCount: 0,
      permissions: [],
      config,
    };

    this.tools.set(tool.id, tool);

    // 이벤트 발생
    this.emit('changed', { id: tool.id, metadata: tool });

    return tool;
  }

  async update(
    id: string,
    patch: Partial<McpToolMetadata>,
    options?: { expectedVersion?: string }
  ): Promise<McpToolMetadata> {
    const existing = this.tools.get(id);
    if (!existing) {
      throw new Error(`Tool not found: ${id}`);
    }

    // Version conflict 시뮬레이션
    if (options?.expectedVersion && existing.version !== options.expectedVersion) {
      throw new Error(`Version conflict for tool ${id}`);
    }

    const previousStatus = existing.status;
    const updated: McpToolMetadata = {
      ...existing,
      ...patch,
      id, // ID는 변경 불가
      version: `v${Date.now()}`, // 새 버전 할당
    };

    this.tools.set(id, updated);
    this.emit('changed', { id, metadata: updated });

    // 상태 변경 시 추가 이벤트
    if (previousStatus !== updated.status) {
      this.emit('statusChanged', { id, metadata: updated, previousStatus });
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.tools.has(id)) {
      throw new Error(`Tool not found: ${id}`);
    }

    this.tools.delete(id);
    this.emit('deleted', { id });
  }

  // Event handling
  on(
    event: 'changed' | 'deleted' | 'statusChanged',
    handler: (payload: McpToolRepositoryEventPayload) => void
  ): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }

    this.eventHandlers.get(event)!.push(handler);

    // Unsubscribe 함수 반환
    return () => {
      const handlers = this.eventHandlers.get(event)!;
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    };
  }

  private emit(event: string, payload: McpToolRepositoryEventPayload): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach((handler) => handler(payload));
  }

  // Test helper methods (optional)
  clear(): void {
    this.tools.clear();
    this.eventHandlers.clear();
  }

  getToolCount(): number {
    return this.tools.size;
  }
}
```

### Fixture 사용 예시

```typescript
// mcp-metadata-registry.test.ts
import { mock } from 'vitest-mock-extended';
import { McpMetadataRegistry } from '../mcp-metadata-registry';
import { McpRegistry } from '../../mcp-registry';
import { MockMcpToolRepository } from './fixture';

describe('McpMetadataRegistry', () => {
  let registry: McpMetadataRegistry;
  let mockRepository: MockMcpToolRepository;
  let mockMcpRegistry: ReturnType<typeof mock<McpRegistry>>;

  beforeEach(async () => {
    // Fixture 인스턴스 생성
    mockRepository = new MockMcpToolRepository();
    mockMcpRegistry = mock<McpRegistry>();

    registry = new McpMetadataRegistry(mockRepository, mockMcpRegistry);
    await registry.initialize();
  });

  it('should persist tools in repository', async () => {
    // Given
    const config = { type: 'stdio', name: 'test-tool', version: '1.0.0' };

    // When
    await registry.registerTool(config);

    // Then - Fixture의 실제 동작 검증
    expect(mockRepository.getToolCount()).toBe(1);
    const tools = await mockRepository.list();
    expect(tools.items[0].name).toBe('test-tool');
  });

  it('should emit events on changes', async () => {
    // Given
    const eventSpy = vi.fn();
    mockRepository.on('changed', eventSpy);

    // When
    await mockRepository.create({ type: 'stdio', name: 'test' });

    // Then
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        metadata: expect.objectContaining({ name: 'test' }),
      })
    );
  });
});
```

## Mock 작성 (Service/Client)

### 언제 Mock을 만드나?

- ✅ **단순 인터페이스** (상태 없음)
- ✅ **메서드 호출 검증**만 필요
- ✅ **외부 서비스/API** 호출 시뮬레이션

### 1. vitest-mock-extended 사용

**권장 방법**: 타입 안전한 Mock 생성

```typescript
import { mock, type MockProxy } from 'vitest-mock-extended';

describe('ServiceClass', () => {
  let service: ServiceClass;
  let mockClient: MockProxy<ClientInterface>;

  beforeEach(() => {
    mockClient = mock<ClientInterface>();
    service = new ServiceClass(mockClient);
  });

  it('should call client method', async () => {
    // Given
    mockClient.fetch.mockResolvedValue({ data: 'test' });

    // When
    const result = await service.getData();

    // Then
    expect(mockClient.fetch).toHaveBeenCalledWith('/api/data');
    expect(result).toEqual({ data: 'test' });
  });
});
```

### 2. Factory 함수로 Mock 생성

**복잡한 Mock**을 여러 테스트에서 재사용하는 경우:

```typescript
// __tests__/mock-factory.ts
import { vi } from 'vitest';
import type { McpRegistry } from '../mcp-registry';

export function createMockMcpRegistry(): MockProxy<McpRegistry> {
  return {
    register: vi.fn().mockResolvedValue(undefined),
    unregister: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    getAll: vi.fn().mockResolvedValue([]),
    isRegistered: vi.fn().mockReturnValue(false),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };
}

// 사용
import { createMockMcpRegistry } from './mock-factory';

describe('Test', () => {
  let mockRegistry: ReturnType<typeof createMockMcpRegistry>;

  beforeEach(() => {
    mockRegistry = createMockMcpRegistry();
  });

  it('uses factory mock', async () => {
    mockRegistry.isRegistered.mockReturnValue(true);
    // ...
  });
});
```

### 3. 부분 Mock (Partial Mock)

**일부 메서드만 Mock**하고 싶은 경우:

```typescript
import { vi } from 'vitest';

const partialMock = {
  method1: vi.fn(),
  method2: vi.fn(),
  // 다른 메서드는 실제 구현 사용
} as Partial<InterfaceType>;
```

## Mock 동작 설정

### 반환값 설정

```typescript
// 단순 값
mockFn.mockReturnValue('test');

// 비동기 성공
mockFn.mockResolvedValue({ id: '123' });

// 비동기 실패
mockFn.mockRejectedValue(new Error('Failed'));

// 호출마다 다른 값
mockFn
  .mockResolvedValueOnce({ status: 'pending' })
  .mockResolvedValueOnce({ status: 'success' });

// 구현 제공
mockFn.mockImplementation((param) => {
  return `processed: ${param}`;
});
```

### 호출 검증

```typescript
// 호출 여부
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(3);

// 파라미터 검증
expect(mockFn).toHaveBeenCalledWith('expected-param');
expect(mockFn).toHaveBeenCalledWith(
  'param1',
  expect.objectContaining({ key: 'value' }),
  undefined
);

// 마지막 호출
expect(mockFn).toHaveBeenLastCalledWith('last-param');

// 모든 호출 확인
expect(mockFn.mock.calls).toEqual([
  ['call1-arg'],
  ['call2-arg'],
]);
```

## 외부 모듈 Mock

### Node.js 내장 모듈

```typescript
import { vi } from 'vitest';
import { promises as fs } from 'fs';

vi.mock('fs/promises');
const mockFs = vi.mocked(fs);

describe('FileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should write file', async () => {
    // Given
    mockFs.writeFile.mockResolvedValue(undefined);

    // When
    await service.saveFile('test.txt', 'content');

    // Then
    expect(mockFs.writeFile).toHaveBeenCalledWith('test.txt', 'content', 'utf-8');
  });
});
```

### 외부 라이브러리

```typescript
vi.mock('axios');
const mockAxios = vi.mocked(axios);

describe('ApiClient', () => {
  it('should fetch data', async () => {
    // Given
    mockAxios.get.mockResolvedValue({
      data: { id: '123' },
      status: 200,
    });

    // When
    const result = await apiClient.getData();

    // Then
    expect(result.id).toBe('123');
  });
});
```

### 프로젝트 내부 모듈

```typescript
// 전체 모듈 Mock
vi.mock('../utils', () => ({
  parseJson: vi.fn(),
  formatDate: vi.fn(),
}));

// 특정 함수만 Mock
vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils');
  return {
    ...actual,
    parseJson: vi.fn(), // 이것만 Mock
  };
});
```

## 이벤트 테스트

### EventEmitter Mock

```typescript
class MockEventEmitter {
  private handlers = new Map<string, Function[]>();

  on(event: string, handler: Function): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);

    return () => {
      const handlers = this.handlers.get(event)!;
      const index = handlers.indexOf(handler);
      if (index >= 0) handlers.splice(index, 1);
    };
  }

  emit(event: string, ...args: unknown[]): void {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach((handler) => handler(...args));
  }

  clear(): void {
    this.handlers.clear();
  }
}
```

### 이벤트 검증

```typescript
it('should emit event', async () => {
  // Given
  const eventSpy = vi.fn();
  emitter.on('dataChanged', eventSpy);

  // When
  await service.updateData({ id: '123' });

  // Then
  expect(eventSpy).toHaveBeenCalledWith({
    id: '123',
    timestamp: expect.any(Date),
  });
});

it('should unsubscribe correctly', () => {
  // Given
  const handler = vi.fn();
  const unsubscribe = emitter.on('event', handler);

  // When
  unsubscribe();
  emitter.emit('event', 'data');

  // Then
  expect(handler).not.toHaveBeenCalled();
});
```

## 타이머 Mock

```typescript
import { vi } from 'vitest';

describe('Scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute after delay', () => {
    // Given
    const callback = vi.fn();
    scheduler.schedule(callback, 1000);

    // When
    vi.advanceTimersByTime(1000);

    // Then
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should execute multiple times', () => {
    // Given
    const callback = vi.fn();
    scheduler.setInterval(callback, 100);

    // When
    vi.advanceTimersByTime(350);

    // Then
    expect(callback).toHaveBeenCalledTimes(3);
  });
});
```

## 날짜/시간 Mock

```typescript
describe('TimeService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use mocked date', () => {
    // When
    const now = service.getCurrentDate();

    // Then
    expect(now.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });
});
```

## Best Practices

### 1. Mock 초기화

```typescript
beforeEach(() => {
  vi.clearAllMocks(); // 모든 Mock 호출 이력 초기화
  mockService = mock<ServiceInterface>(); // 새 인스턴스 생성
});
```

### 2. 타입 안전성 유지

```typescript
// ✅ 올바름 - 타입 안전
const mockService: MockProxy<ServiceInterface> = mock<ServiceInterface>();

// ❌ 지양 - any 사용
const mockService = vi.fn() as any;
```

### 3. 구체적인 검증

```typescript
// ✅ 구체적
expect(mockFn).toHaveBeenCalledWith(
  'expectedId',
  expect.objectContaining({
    name: 'test',
    count: 5,
  })
);

// ❌ 모호함
expect(mockFn).toHaveBeenCalled();
```

### 4. Fixture는 별도 파일

```typescript
// ✅ 재사용 가능
// __tests__/fixture.ts
export class MockRepository { ... }

// ❌ 테스트 파일 내부 (재사용 어려움)
describe('Test', () => {
  class MockRepository { ... }
});
```

## 참고 문서

- [Unit Test Convention](./unit-test.md)
- [Testing Guide](../../../docs/30-developer-guides/testing.md)
- [vitest-mock-extended](https://github.com/marchaos/vitest-mock-extended)
