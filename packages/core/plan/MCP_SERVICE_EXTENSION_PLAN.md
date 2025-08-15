# MCP Service Extension Plan

## 개요

본 계획서는 AgentOS Core의 MCP(Model Context Protocol) 서비스를 확장하여 SSOT(Single Source of Truth) + 이벤트 기반 아키텍처로 재설계하는 작업을 다룹니다. 기존 저수준 `Mcp` 클래스를 감싸서 고수준 서비스 계층을 제공하고, GUI와의 타입 불일치 문제를 해결합니다.

## 요구사항

### 핵심 목표
1. **SSOT 구현**: `McpRegistry`가 모든 MCP 도구 상태의 단일 출처 역할
2. **이벤트 기반**: 모든 상태 변경을 이벤트로 발행하여 반응적 UI 업데이트 지원
3. **포트-어댑터 패턴**: MCP 프로토콜을 AgentOS 도메인에 맞게 추상화
4. **ServiceContainer 통합**: 표준화된 의존성 주입으로 GUI와 일관된 API 제공
5. **확장 가능**: 외부 저장소(SQLite, HTTP) 어댑터 지원을 위한 Repository 패턴

### 성공 조건
- [ ] GUI 컴포넌트가 타입 에러 없이 MCP 서비스 사용 가능
- [ ] 도구 연결/해제 시 실시간 이벤트 발행 및 구독
- [ ] 여러 MCP 도구의 중앙화된 상태 관리
- [ ] 사용량 추적 및 통계 제공
- [ ] 기존 `Mcp` 클래스와의 호환성 유지

### 사용 시나리오
1. **GUI에서 MCP 도구 목록 조회**: `mcpService.getAllToolMetadata()` 호출
2. **도구 연결**: `mcpService.connectMcp(config)` 호출 후 이벤트 구독으로 상태 업데이트
3. **실시간 사용량 모니터링**: `mcpService.onUsageLogged()` 구독으로 로그 수집
4. **도구 검색**: Repository의 `search()` 메서드로 카테고리/키워드 기반 필터링

## 인터페이스 초안

### 1. McpToolRepository (영속화 계층)
```typescript
export interface McpToolRepository {
  get(id: string): Promise<McpToolMetadata | null>;
  list(pagination?: CursorPagination): Promise<CursorPaginationResult<McpToolMetadata>>;
  search(query: McpToolSearchQuery, pagination?: CursorPagination): Promise<CursorPaginationResult<McpToolMetadata>>;
  create(config: McpConfig): Promise<McpToolMetadata>;
  update(id: string, patch: Partial<McpToolMetadata>, options?: { expectedVersion?: string }): Promise<McpToolMetadata>;
  delete(id: string): Promise<void>;
  on?(event: 'changed' | 'deleted', handler: (payload: { id: string; metadata?: McpToolMetadata }) => void): () => void;
}
```

### 2. McpRegistry (SSOT + 런타임 관리)
```typescript
export interface McpRegistry {
  register(config: McpConfig): Promise<string>;
  unregister(toolId: string): Promise<void>;
  connect(toolId: string): Promise<void>;
  disconnect(toolId: string): Promise<void>;
  get(toolId: string): Promise<Mcp | null>;
  getMetadata(toolId: string): Promise<McpToolMetadata | null>;
  getAllMetadata(): Promise<McpToolMetadata[]>;
  getUsageLogs(toolId?: string): Promise<McpUsageLog[]>;
  on(event: McpRegistryEvent, handler: McpRegistryEventHandler): () => void;
}
```

### 3. McpService (Facade)
```typescript
export interface McpService {
  connectMcp(config: McpConfig): Promise<string>;
  disconnectMcp(toolId: string): Promise<void>;
  getAllToolMetadata(): Promise<McpToolMetadata[]>;
  getUsageLogs(toolId?: string): Promise<McpUsageLog[]>;
  onToolChanged(handler: (metadata: McpToolMetadata) => void): () => void;
  onUsageLogged(handler: (log: McpUsageLog) => void): () => void;
}
```

## Todo 리스트

### Phase 1: 기반 구조
- [ ] **TODO 1/6**: McpToolRepository 인터페이스 정의 및 파일 기반 구현
  - `packages/core/src/tool/mcp/repository/mcp-tool-repository.ts` 인터페이스 
  - `packages/core/src/tool/mcp/repository/file-mcp-tool-repository.ts` 구현
  - 기존 `McpConfig`를 `McpToolMetadata`로 변환하는 매핑 로직

- [ ] **TODO 2/6**: McpRegistry SSOT 런타임 관리 구현
  - `packages/core/src/tool/mcp/mcp-registry.ts` 핵심 로직
  - 기존 `Mcp` 인스턴스들의 생명주기 관리
  - 상태 변경 이벤트 발행 (`SimpleEventEmitter` 사용)

- [ ] **TODO 3/6**: McpService Facade 및 이벤트 통합
  - `packages/core/src/tool/mcp/mcp-service.ts` 외부 API 표면
  - Repository와 Registry 조합하여 일관된 API 제공
  - GUI 친화적 이벤트 구독 메서드

### Phase 2: 통합 및 테스트
- [ ] **TODO 4/6**: ServiceContainer 등록 및 의존성 주입
  - 서비스 타입 정의 추가
  - 기본 구현체들의 컨테이너 등록
  - 순환 의존성 방지를 위한 팩토리 패턴 적용

- [ ] **TODO 5/6**: 단위 테스트 및 통합 테스트 작성
  - Repository, Registry, Service 계층별 테스트
  - 이벤트 발행/구독 시나리오 테스트
  - 기존 `Mcp` 클래스와의 호환성 테스트

- [ ] **TODO 6/6**: 문서 업데이트 및 예제 코드
  - API 레퍼런스 문서 작성
  - GUI 통합 가이드
  - 마이그레이션 가이드 (기존 코드 → 새 서비스)

## 작업 순서

1. **설계 검증**: 기존 코드와의 호환성 및 타입 안전성 확인
2. **레이어별 구현**: Repository → Registry → Service 순으로 bottom-up 접근
3. **이벤트 통합**: 각 계층에서 적절한 이벤트 발행 및 전파
4. **ServiceContainer 등록**: 의존성 주입으로 느슨한 결합 구현
5. **테스트 및 검증**: 기능 테스트, 성능 테스트, 타입 안전성 검증
6. **문서화**: 사용법, 아키텍처, 마이그레이션 가이드

## 아키텍처 원칙 준수

본 계획은 AgentOS의 다음 아키텍처 원칙들을 준수합니다:

1. **SSOT**: `McpRegistry`가 모든 MCP 도구 상태의 단일 출처
2. **이벤트 기반**: 상태 변경을 이벤트로 발행하여 반응적 업데이트
3. **포트-어댑터**: Repository 인터페이스로 저장소 추상화
4. **조합 가능**: 각 서비스는 독립적이며 인터페이스 기반 결합
5. **타입 안전성**: `any` 사용 금지, 구체적 타입 및 타입 가드 활용

## 위험 요소 및 대응

### 위험 요소
1. **기존 코드 호환성**: 현재 `Mcp` 클래스를 사용하는 코드들의 영향
2. **이벤트 순환**: Registry ↔ Repository 간 이벤트 순환 가능성
3. **메모리 누수**: 이벤트 리스너 정리 누락

### 대응 방안
1. **어댑터 패턴**: 기존 API를 새 서비스로 위임하는 어댑터 제공
2. **이벤트 방향성**: Repository → Registry → Service 단방향 이벤트 흐름
3. **자동 정리**: `WeakMap` 활용 및 명시적 `unsubscribe` 함수 제공

## 성과 측정

### 기술적 지표
- 타입 안전성: `any` 사용량 0건
- 테스트 커버리지: 90% 이상
- 빌드 성공률: 100%

### 기능적 지표
- GUI 통합 성공: 타입 에러 없이 모든 MCP 기능 사용 가능
- 이벤트 반응성: 상태 변경 후 100ms 이내 UI 업데이트
- 확장성: 새로운 Repository 구현체 추가 용이성

---

## 관련 문서

- [AGENT_ARCHITECTURE.md](../docs/AGENT_ARCHITECTURE.md) - AgentOS 아키텍처 철학
- [AGENT_IMPLEMENTATION_GUIDELINES.md](../docs/AGENT_IMPLEMENTATION_GUIDELINES.md) - 구현 가이드라인
- [Git Workflow Guide](../../docs/GIT_WORKFLOW_GUIDE.md) - 개발 프로세스

## 승인 및 진행

이 계획서는 AgentOS의 아키텍처 원칙에 따라 작성되었으며, Git 워크플로우 지침에 따라 TODO별 커밋으로 진행됩니다.

**승인 대기 중** - 계획서 검토 후 구현 시작