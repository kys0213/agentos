# 작업계획서: Core LLM Bridge Registry Spec

## Requirements

### 성공 조건

- [ ] 설치된 LLM 브릿지(Manifest 기반)를 등록/조회/삭제할 수 있다.
- [ ] 활성화된 브릿지의 `id`를 조회/설정할 수 있다.
- [ ] 파일 기반 저장소로 동작하며 앱 간 재사용 가능하다.
- [ ] 타입 안전(Template: `llm-bridge-spec@^1`의 `LlmManifest` 활용) 보장.
- [ ] GUI와 Electron Main에서 동일한 스펙을 재사용할 수 있도록 `@agentos/core`에 공개(exports).

### 사용 시나리오

- [ ] GUI가 `getBridgeIds()`와 `getBridgeConfig(id)`를 통해 설치된 목록과 상세 정보를 표시한다.
- [ ] GUI가 `getCurrentBridge()`로 활성 브릿지 상태를 표시한다.
- [ ] Main 프로세스 또는 별도 서비스가 `register(manifest)`로 브릿지를 설치한다.
- [ ] 유저가 선택 시 `setActiveId(id)`로 활성 브릿지를 전환한다.

### 제약 조건

- [ ] 런타임 `LlmBridge` 인스턴스 관리(생성/해제)는 본 스펙의 범위 밖(등록/상태 저장만 담당).
- [ ] 가격/프로바이더/엔드포인트/키 등 카탈로그/환경설정 정보는 별도 모듈에서 관리.

## Interface Sketch

```typescript
// packages/core/src/llm/bridge/types.ts
export type BridgeId = string;
export interface InstalledBridgeRecord {
  id: BridgeId;
  manifest: LlmManifest;
  installedAt: Date;
}
export interface InstalledBridgeSummary {
  id: BridgeId;
  name: string;
  description: string;
  language: string;
}
export interface ActiveBridgeState {
  activeId: BridgeId | null;
  updatedAt: Date;
}

// packages/core/src/llm/bridge/registry.ts
export interface LlmBridgeRegistry {
  listIds(): Promise<BridgeId[]>;
  listSummaries(): Promise<InstalledBridgeSummary[]>;
  getManifest(id: BridgeId): Promise<LlmManifest | null>;
  register(manifest: LlmManifest, opts?: { id?: BridgeId }): Promise<BridgeId>;
  unregister(id: BridgeId): Promise<void>;
  getActiveId(): Promise<BridgeId | null>;
  setActiveId(id: BridgeId | null): Promise<void>;
}
export class FileBasedLlmBridgeRegistry implements LlmBridgeRegistry {
  /* file I/O */
}

// packages/core/src/llm/bridge/usage.ts (선택)
export interface LlmBridgeUsageTracker {
  /* in-memory usage aggregation */
}
```

## Todo

- [x] 타입 정의(`types.ts`) 설계 및 가드 구현
- [x] 파일 기반 레지스트리(`registry.ts`) 기본 CRUD 구현
- [x] 활성 브릿지 상태 저장/로드 구현
- [x] 사용량 트래커(`usage.ts`) 선택 제공(후속 GUI 분석 탭 지원)
- [x] `packages/core/src/index.ts`에 export 추가
- [x] 단위 테스트 작성(파일 I/O with temp dir)
- [x] 문서화(`docs/`에 개요 및 예시 코드)

## 작업 순서

1. 타입 정의 및 인터페이스(레지스트리/요약/활성 상태) 확정
2. 파일 기반 구현(등록/조회/삭제/활성 상태) + 기본 테스트
3. 사용량 트래커(선택) 초안 추가 및 테스트
4. 패키지 export 및 문서화
5. GUI/Electron에서 사용하는 IPC와의 연결 포인트 제안 문서화
