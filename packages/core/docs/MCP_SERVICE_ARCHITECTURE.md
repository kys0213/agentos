# MCP Service Architecture

## 개요

AgentOS Core의 MCP(Model Context Protocol) 서비스는 SSOT(Single Source of Truth) + 이벤트 기반 아키텍처로 구현되어 있습니다. 4-레이어 구조로 설계되어 순수한 프로토콜 구현부터 고수준 비즈니스 로직까지 명확하게 분리되어 있습니다.

## 아키텍처 다이어그램

```
┌─ McpService (Business Logic Facade)
│  ├─ McpMetadataRegistry (Metadata + State + Integration)
│  │  ├─ McpRegistry (Protocol Registry)
│  │  │  └─ Mcp (Pure Protocol Client)
│  │  └─ McpToolRepository (Data Persistence)
└─────────────────────────────────────────
```

## 핵심 설계 원칙

### 1. 단일 책임 원칙 (SRP)
- **Mcp**: MCP 프로토콜 통신만 담당
- **McpRegistry**: 여러 MCP 인스턴스 등록/관리
- **McpToolRepository**: 메타데이터 영속화
- **McpMetadataRegistry**: 프로토콜과 메타데이터 통합
- **McpService**: 비즈니스 로직 및 외부 API

### 2. SSOT (Single Source of Truth)
- `McpMetadataRegistry`가 모든 MCP 도구 상태의 중앙 관리소
- 메타데이터와 실제 연결 상태 동기화
- 이벤트 기반으로 모든 상태 변경 전파

### 3. 이벤트 기반 아키텍처
- Repository → Registry → Service 계층별 이벤트 전파
- 실시간 상태 업데이트 지원
- GUI의 반응적 UI 업데이트 가능

## 레이어별 상세 구조

### 1. Protocol Layer (`Mcp`)

**목적**: MCP 프로토콜의 순수한 구현체

**주요 책임**:
- MCP 서버와의 연결/해제 관리
- 도구, 리소스, 프롬프트 조회 및 실행
- 네트워크 수준의 이벤트 발생 (CONNECTED, DISCONNECTED)
- 연결 상태 및 유휴 타임아웃 관리

**지원 전송 타입**:
- `stdio`: 표준 입출력 기반 통신
- `streamableHttp`: HTTP 스트리밍 통신
- `websocket`: WebSocket 실시간 통신
- `sse`: Server-Sent Events (deprecated)

**주요 메서드**:
```typescript
class Mcp {
  static create(config: McpConfig): Mcp
  async connect(): Promise<void>
  async disconnect(): Promise<void>
  async invokeTool(tool: Tool, options?: { input?: Record<string, unknown> }): Promise<InvokeToolResult>
  async getTools(): Promise<Tool[]>
  async getResources(): Promise<Resource[]>
  async getPrompts(): Promise<Prompt[]>
  isConnected(): boolean
}
```

### 2. Registry Layer (`McpRegistry`)

**목적**: 여러 MCP 인스턴스의 통합 관리

**주요 책임**:
- 다중 MCP 연결 등록/해제
- MCP 이름 기반 도구 조회
- 연결 상태 관리 및 재연결

**주요 메서드**:
```typescript
class McpRegistry {
  async register(config: McpConfig): Promise<void>
  async unregister(name: string): Promise<void>
  async get(name: string): Promise<Mcp | null>
  async getTool(name: string): Promise<{ mcp: Mcp; tool: Tool } | null>
  isRegistered(name: string): boolean
  onRegister(callback: (mcp: Mcp) => void): void
  onUnregister(callback: (mcp: Mcp) => void): void
}
```

### 3. Repository Layer (`McpToolRepository`)

**목적**: 메타데이터 영속화 및 검색 인터페이스

**주요 기능**:
- CRUD 작업 (생성, 조회, 수정, 삭제)
- 고급 검색 (키워드, 카테고리, 상태별)
- 커서 기반 페이지네이션
- 이벤트 발행 (changed, deleted, statusChanged)
- 낙관적 동시성 제어

**구현체**: `FileMcpToolRepository`
- JSON 파일 기반 저장소 (`.agentos/mcp/mcp-tools.json`)
- 인메모리 캐싱으로 성능 최적화
- 민감 정보 마스킹 (비밀번호, 토큰 등)

**인터페이스**:
```typescript
interface McpToolRepository {
  get(id: string): Promise<McpToolMetadata | null>
  list(pagination?: CursorPagination): Promise<CursorPaginationResult<McpToolMetadata>>
  search(query: McpToolSearchQuery, pagination?: CursorPagination): Promise<CursorPaginationResult<McpToolMetadata>>
  create(config: McpConfig): Promise<McpToolMetadata>
  update(id: string, patch: Partial<McpToolMetadata>, options?: { expectedVersion?: string }): Promise<McpToolMetadata>
  delete(id: string): Promise<void>
  on?(event: 'changed' | 'deleted' | 'statusChanged', handler: EventHandler): () => void
}
```

### 4. Metadata Registry Layer (`McpMetadataRegistry`)

**목적**: 실제 MCP 연결과 메타데이터 동기화

**주요 책임**:
- `McpRegistry`와 `McpToolRepository` 통합
- 실제 연결 상태와 메타데이터 동기화
- 도구 등록 시 메타데이터 저장 + MCP 연결 수행
- 연결 실패 시 에러 상태로 메타데이터 업데이트

**핵심 로직**:
```typescript
async registerTool(config: McpConfig): Promise<McpToolMetadata> {
  // 1. Repository에 메타데이터 저장
  const metadata = await this.repository.create(config);
  
  try {
    // 2. 실제 MCP 연결
    await this.mcpRegistry.register(config);
    
    // 3. 연결 성공 시 상태 업데이트
    return await this.updateConnectionStatus(metadata.id, 'connected');
  } catch (error) {
    // 4. 연결 실패 시 에러 상태로 업데이트
    await this.updateConnectionStatus(metadata.id, 'error');
    throw error;
  }
}
```

### 5. Service Layer (`McpService`)

**목적**: 비즈니스 로직 Facade 및 통합 API

**주요 기능**:
- 입력 검증 및 에러 처리
- 작업 lifecycle 이벤트 발행 (operationStarted, operationCompleted)
- Repository와 Registry 기능 통합
- 통계 및 분석 기능 제공

**이벤트 시스템**:
```typescript
type McpServiceEvents = {
  serviceInitialized: { totalTools: number }
  operationStarted: { operation: string; toolId?: string }
  operationCompleted: { operation: string; toolId?: string; success: boolean }
  toolAdded: { tool: McpToolMetadata }
  toolRemoved: { toolId: string }
  connectionStatusChanged: { toolId: string; status: McpConnectionStatus }
  toolUpdated: { tool: McpToolMetadata }
}
```

## 데이터 모델

### McpToolMetadata
```typescript
interface McpToolMetadata {
  id: string                    // 고유 식별자
  name: string                  // 도구 이름
  description?: string          // 설명
  version: string              // 버전
  category?: string            // 카테고리 (development, productivity, etc.)
  provider?: string            // 제공자
  status: McpConnectionStatus  // 연결 상태 (connected, disconnected, pending, error)
  usageCount: number           // 사용 횟수
  lastUsedAt?: Date            // 마지막 사용 시간
  createdAt: Date              // 생성 시간
  updatedAt: Date              // 수정 시간
  permissions: string[]        // 권한 목록
  config: Record<string, unknown> // 설정 (민감 정보 마스킹됨)
}
```

### McpConfig (Union Type)
```typescript
type McpConfig = 
  | StdioMcpConfig      // 표준 입출력
  | StreamableHttpMcpConfig  // HTTP 스트리밍
  | WebSocketMcpConfig  // WebSocket
  | SseMcpConfig        // Server-Sent Events
```

## 사용 예시

### 1. 서비스 초기화 및 도구 등록
```typescript
import { McpService, FileMcpToolRepository, McpMetadataRegistry } from '@agentos/core'

// 의존성 설정
const repository = new FileMcpToolRepository()
const registry = new McpMetadataRegistry(repository)
const service = new McpService(repository, registry)

// 서비스 초기화
await service.initialize()

// 도구 등록
const tool = await service.registerTool({
  type: 'stdio',
  name: 'my-tool',
  version: '1.0.0',
  command: 'node',
  args: ['script.js']
})
```

### 2. 이벤트 구독 및 상태 모니터링
```typescript
// 도구 추가 이벤트 구독
service.on('toolAdded', ({ tool }) => {
  console.log(`New tool added: ${tool.name}`)
})

// 연결 상태 변경 이벤트 구독
service.on('connectionStatusChanged', ({ toolId, status }) => {
  console.log(`Tool ${toolId} status: ${status}`)
})

// 통계 조회
const stats = service.getStatistics()
console.log(`Total tools: ${stats.total}, Connected: ${stats.connected}`)
```

### 3. 도구 검색 및 필터링
```typescript
// 키워드 검색
const results = await service.searchTools({
  keywords: ['git', 'version control'],
  category: 'development'
})

// 상태별 필터링
const connectedTools = service.getToolsByStatus('connected')
const categoryTools = service.getToolsByCategory('productivity')
```

## 성능 및 최적화

### 1. 캐싱 전략
- **Repository 레벨**: 인메모리 캐시로 디스크 I/O 최소화
- **Write-through 패턴**: 쓰기 시 캐시와 디스크 동시 업데이트
- **Cache invalidation**: 파일 수정 시 캐시 무효화

### 2. 페이지네이션
- **커서 기반**: 대량 데이터 효율적 처리
- **Direction 지원**: 앞/뒤 페이지 네비게이션
- **hasMore 필드**: UI에서 더보기 버튼 제어 가능

### 3. 동시성 제어
- **낙관적 락킹**: 버전 기반 충돌 감지
- **Event 기반 동기화**: 다중 인스턴스 간 상태 동기화

## 확장 가능성

### 1. Storage Adapter
현재 파일 기반 저장소를 다른 백엔드로 확장 가능:
- `SqliteMcpToolRepository`: SQLite 데이터베이스
- `HttpMcpToolRepository`: REST API 백엔드  
- `RedisMcpToolRepository`: Redis 캐시 저장소

### 2. Transport Support
새로운 MCP 전송 방식 추가:
- gRPC transport
- Message Queue transport
- P2P transport

### 3. Plugin System
MCP 도구별 특화 기능:
- Custom metadata fields
- Tool-specific configurations
- Advanced analytics and monitoring

## 마이그레이션 가이드

### 기존 `Mcp` 클래스 사용자
```typescript
// Before (직접 Mcp 사용)
const mcp = Mcp.create(config, true) // usageTrackingEnabled
const logs = mcp.getUsageLogs()
const metadata = mcp.getMetadata()

// After (Service 레이어 사용)
const service = new McpService(repository, registry)
await service.initialize()
const tool = await service.registerTool(config)
// 사용량 추적은 자동으로 Service 레이어에서 처리
const stats = service.getStatistics()
```

### GUI 컴포넌트 통합
```typescript
// React 컴포넌트 예시
function McpToolList() {
  const [tools, setTools] = useState([])
  
  useEffect(() => {
    // 초기 도구 목록 로드
    const allTools = mcpService.getAllTools()
    setTools(allTools.items)
    
    // 실시간 업데이트 구독
    const unsubscribe = mcpService.on('toolAdded', ({ tool }) => {
      setTools(prev => [...prev, tool])
    })
    
    return unsubscribe
  }, [])
  
  return (
    <div>
      {tools.map(tool => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  )
}
```

## 트러블슈팅

### 일반적인 문제들

1. **연결 타임아웃**: `network.timeoutMs` 설정 조정
2. **메타데이터 동기화**: Registry 초기화 후 repository 상태 확인
3. **이벤트 누락**: 구독 등록 시점과 서비스 초기화 순서 확인
4. **성능 이슈**: 캐시 히트율 및 페이지네이션 크기 조정

### 로깅 및 디버깅
- Repository 레벨에서 파일 I/O 로깅
- Registry 레벨에서 MCP 연결 상태 추적  
- Service 레벨에서 operation 이벤트 모니터링
- 전역 에러 핸들러로 예외 상황 캐치

이 아키텍처는 확장 가능하고 테스트 가능한 구조로 설계되어, AgentOS의 MCP 통합을 견고하고 유지보수하기 쉽게 만듭니다.