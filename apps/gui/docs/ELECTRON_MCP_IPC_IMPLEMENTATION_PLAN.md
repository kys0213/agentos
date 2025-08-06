# Electron MCP IPC 구현 계획서

## 🎯 구현 목표

AgentOS Core의 MCP 사용량 추적 기능을 Electron Main-Renderer 간 IPC 통신으로 연동하여 실시간 사용량 데이터를 GUI에 제공합니다.

## 📋 TODO 리스트

### ✅ Phase 1: 설계 및 계획 (완료)
- [x] IPC 아키텍처 설계 및 스펙 정의 ([ELECTRON_MCP_IPC_SPEC.md](./ELECTRON_MCP_IPC_SPEC.md))
- [x] 구현 계획서 작성

### 🚧 Phase 2: 타입 정의 및 인터페이스 확장
- [ ] **[TODO 1/8]** Shared Types: MCP 사용량 추적 타입 정의 (`mcp-usage-types.ts`)
- [ ] **[TODO 2/8]** Electron API 타입 확장 (`electron-api.ts`)
- [ ] **[TODO 3/8]** IpcChannel 인터페이스 확장 (사용량 추적 메서드 추가)

### 🔧 Phase 3: Main Process 구현
- [ ] **[TODO 4/8]** MCP IPC 핸들러 확장 (사용량 추적 핸들러들)
- [ ] **[TODO 5/8]** 실시간 이벤트 브로드캐스팅 시스템 구현

### 🎨 Phase 4: Renderer Process 구현
- [ ] **[TODO 6/8]** ElectronIpcChannel 구현체 확장
- [ ] **[TODO 7/8]** McpService 사용량 추적 기능 추가

### ✅ Phase 5: 통합 및 검증
- [ ] **[TODO 8/8]** 타입체크, 빌드, 테스트 실행 및 검증

## 🏗️ 구현 상세 계획

### Phase 2: 타입 정의 및 인터페이스 확장

#### TODO 1/8: Shared Types 정의
**파일**: `apps/gui/src/shared/types/mcp-usage-types.ts` (신규)

```typescript
// Core 타입 재사용
import { McpToolMetadata, McpUsageLog, McpUsageStats } from '@agentos/core';

// GUI 전용 확장 타입들
export interface UsageLogQueryOptions { ... }
export interface McpUsageUpdateEvent { ... }
export interface GuiMcpToolMetadata extends McpToolMetadata { ... }
export interface McpUsageDashboard { ... }
```

#### TODO 2/8: Electron API 타입 확장
**파일**: `apps/gui/src/shared/types/electron-api.ts` (기존 파일 확장)

```typescript
export interface McpAPI {
  // 기존 메서드들 유지
  getAll: () => Promise<McpConfig[]>;
  // ... 기존 메서드들

  // 새로운 사용량 추적 메서드들 추가
  getToolMetadata: (clientName: string) => Promise<McpToolMetadata>;
  getAllToolMetadata: () => Promise<McpToolMetadata[]>;
  getUsageLogs: (clientName: string, options?: UsageLogQueryOptions) => Promise<McpUsageLog[]>;
  // ... 추가 메서드들
}
```

#### TODO 3/8: IpcChannel 인터페이스 확장
**파일**: `apps/gui/src/renderer/services/ipc/IpcChannel.ts` (기존 파일 확장)

기존 MCP 메서드들 아래에 사용량 추적 메서드들 추가.

### Phase 3: Main Process 구현

#### TODO 4/8: MCP IPC 핸들러 확장
**파일**: `apps/gui/src/main/services/mcp-ipc-handlers.ts` (기존 파일 확장)

- `mcp:get-tool-metadata` 핸들러 구현
- `mcp:get-all-tool-metadata` 핸들러 구현
- `mcp:get-usage-logs` 핸들러 구현
- `mcp:get-all-usage-logs` 핸들러 구현
- `mcp:get-usage-stats` 핸들러 구현
- `mcp:clear-usage-logs` 핸들러 구현
- `mcp:set-usage-tracking` 핸들러 구현

#### TODO 5/8: 실시간 이벤트 시스템
**기능**: 사용량 변경 시 Renderer로 자동 알림

- `mcp:subscribe-usage-updates` 핸들러 구현
- 폴링 기반 변경 감지 (Core 이벤트 시스템 개선까지 임시)
- `broadcastUsageEvent()` 함수로 이벤트 전송

### Phase 4: Renderer Process 구현

#### TODO 6/8: ElectronIpcChannel 확장
**파일**: `apps/gui/src/renderer/services/ipc/ElectronIpcChannel.ts` (기존 파일 확장)

IpcChannel 인터페이스의 새로운 메서드들을 electron IPC 호출로 구현.

#### TODO 7/8: McpService 확장
**파일**: `apps/gui/src/renderer/services/mcp-service.ts` (기존 파일 확장)

- 사용량 추적 메서드들 추가
- 실시간 업데이트 구독 시스템 구현
- `getDashboardData()` 유틸리티 메서드 구현

## 🔧 구현 원칙

### 1. 기존 코드 보존
- 모든 기존 기능 유지 (Breaking Change 금지)
- 새 기능은 옵셔널 확장으로만 추가
- 기존 테스트 통과 보장

### 2. 타입 안전성
- 모든 IPC 통신에 엄격한 타입 정의
- Core 타입 재사용으로 일관성 보장
- any 타입 사용 절대 금지

### 3. 에러 처리
- IPC 통신 실패에 대한 견고한 처리
- 사용량 추적 실패가 기본 MCP 기능에 영향 주지 않음
- 적절한 로깅과 사용자 피드백

### 4. 성능 최적화
- 필요시에만 사용량 데이터 요청
- 실시간 업데이트 구독/해제 관리
- 메모리 누수 방지

## 🧪 테스트 전략

### 각 TODO 완료 후 실행할 검증
```bash
# 타입 체크
pnpm typecheck

# 빌드 확인
pnpm build

# 기존 테스트 통과 확인
pnpm test

# 린트 검사
pnpm lint
```

### 통합 테스트 시나리오
1. MCP 클라이언트 연결 후 사용량 추적 데이터 조회
2. 도구 실행 시 실시간 사용량 업데이트 확인
3. 대용량 사용량 로그 페이지네이션 테스트
4. 이벤트 구독/해제 메모리 누수 테스트

## 🚀 성공 기준

### 기능적 요구사항
- [ ] MCP 사용량 데이터가 GUI에서 실시간으로 표시됨
- [ ] 사용량 통계 대시보드가 정상 동작함
- [ ] 기존 MCP 기능들이 모두 정상 동작함

### 기술적 요구사항
- [ ] 모든 타입체크 통과
- [ ] 모든 빌드 성공
- [ ] 기존 테스트 모두 통과
- [ ] 새로운 IPC 메서드들의 타입 안전성 보장

### 성능 요구사항
- [ ] 사용량 데이터 조회 응답시간 < 100ms
- [ ] 실시간 업데이트 지연시간 < 1초
- [ ] 메모리 사용량 증가 < 10MB

## 📚 참고 문서

- [ELECTRON_MCP_IPC_SPEC.md](./ELECTRON_MCP_IPC_SPEC.md) - 상세 IPC 스펙
- [Git Workflow Guide](../../docs/GIT_WORKFLOW_GUIDE.md) - Git 작업 절차
- [AgentOS Core Documentation](https://github.com/agentos-project/agentos) - Core MCP 기능

## 🔄 Git 작업 절차

이 구현은 `feature/electron-mcp-ipc` 브랜치에서 진행되며, 각 TODO 완료 시마다 커밋을 생성합니다:

```bash
# 브랜치 생성 및 작업 시작
git checkout -b feature/electron-mcp-ipc

# TODO 1 완료 후
git commit -m "✅ [TODO 1/8] Add MCP usage tracking shared types

- Create mcp-usage-types.ts with Core type extensions
- Define UsageLogQueryOptions, McpUsageUpdateEvent interfaces
- Add GuiMcpToolMetadata and McpUsageDashboard types"

# ... 각 TODO별 커밋 반복

# 최종 완료 후
git commit -m "🎉 [FEATURE] Complete Electron MCP IPC implementation

- Real-time MCP usage data synchronization
- GUI dashboard with usage statistics
- Type-safe IPC communication layer
- Event subscription system for live updates"
```

모든 TODO 완료 후 Pull Request를 생성하여 코드 리뷰를 진행합니다.