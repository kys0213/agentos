# Shimmy 사이드카 통합 작업계획서

## Requirements

### 성공 조건

- [ ] 사용자가 온디바이스 모델을 활성화하면 `ShimmyProcessManager`가 shimmy 바이너리를 조건부로 실행하고, 포트 탐색/헬스체크까지 마친 뒤 사용 가능 상태를 통지한다.
- [ ] `AccelDetector`가 현재 OS와 GPU 정보를 바탕으로 shimmy 실행에 필요한 가속 플래그(`cpu`/`cuda`/`metal`/`mlx`/`opencl`)를 판별하여 프로세스 기동 인자로 전달한다.
- [ ] `ModelRegistry`가 `shimmy list` 결과를 파싱하여 설치된 모델 목록과 기본 모델 여부를 반환하고, 기본 모델이 없을 경우 다운로드/보장 로직의 훅을 제공한다.
- [ ] 프로세스 제어 기본값(재시작 한도, 헬스체크 주기 등)이 단일 클래스에서 관리되어 환경별 일관성을 보장한다.
- [ ] OpenAI 호환 호출은 기존 `openai-llm-bridge` 브리지를 재사용하고, shimmy 포트를 baseURL로 주입하는 방식으로 구성된다.
- [ ] 모든 구성요소는 실패 시 `ShimmyErrorCode`를 활용해 일관된 오류 모델을 노출한다.

### 사용 시나리오

- [ ] GUI/CLI가 온디바이스 모드 토글을 켰을 때 `ShimmyProcessManager.start`로 사이드카를 가동하고 준비 완료 이벤트를 수신한 뒤 채팅을 실행한다.
- [ ] 사용자가 모델 대시보드에서 로컬 모델 목록을 조회하면 `ModelRegistry.listLocal`을 통해 shimmy가 보유한 모델을 즉시 보여준다.
- [ ] 기본 모델이 없거나 삭제된 경우 `ModelRegistry.ensureDefault`가 다운로드 핸들러를 호출하고 완료 후 `ShimmyProcessManager.ensureReady`로 재검증한다.
- [ ] CLI에서 `agent run` 명령이 shimmy 준비 완료 후 OpenAI SDK 호환 클라이언트를 생성하고 스트리밍으로 응답을 출력한다.

### 제약 조건

- [ ] Node.js 20 이상 / cross-platform (macOS, Windows, Linux) 환경을 지원해야 하며, 외부 네이티브 의존성 없이 child_process, os 내장 모듈만 사용한다.
- [ ] shimmy 바이너리가 번들되어 있다고 가정하되, 파일 경로/권한 문제 발생 시 명확한 오류를 반환해야 한다.
- [ ] 네트워크 의존성 없이 로컬에서 동작해야 하므로 HTTP 헬스체크는 기본 내장 라이브러리(`http`/`https`)만 사용한다.

## Interface Sketch

```typescript
export interface ShimmyProcessOptions {
  shimmyPath: string;
  preferredPort: number;
  modelsDir: string;
  args?: string[];
  gpuMode: 'auto' | 'cpu' | 'cuda' | 'metal' | 'mlx' | 'opencl';
  healthTimeoutMs: number;
  env?: NodeJS.ProcessEnv;
  maxRestarts?: number;
}

export interface ShimmyProcessManager {
  start(options: ShimmyProcessOptions): Promise<void>;
  ensureReady(timeoutMs?: number): Promise<void>;
  stop(): Promise<void>;
  getPort(): number | null;
  on(event: ShimmyProcessEvent, listener: ShimmyProcessEventListener): this;
}

export interface AccelDetectorResult {
  recommended: 'cpu' | 'cuda' | 'metal' | 'mlx' | 'opencl';
  reason: string;
}

export interface ModelRegistry {
  listLocal(): Promise<ShimmyModelSummary[]>;
  ensureDefault(modelId: string, download: DownloadHandler): Promise<void>;
}

```

## Todo

- [x] `packages/shimmy-manager`에 shimmy 사이드카 프로세스 관리 모듈 추가 (`child_process` 스폰, 포트 재시도, 헬스체크 포함)
- [x] AccelDetector 유틸리티 작성 (OS/GPU 탐지 및 실행 플래그 결정)
- [x] ModelRegistry 구현 (shimmy list 파싱, 기본 모델 보장 로직)
- [x] 프로세스 제어 기본값 클래스로 상수 정리
- [x] 단위 테스트 추가 (프로세스 매니저, 가속 감지, 모델 목록 파서)
- [x] 통합 테스트 스텁 추가 (shimmy 프로세스 목킹)
- [x] 개발자 문서 업데이트 (설정/사용 가이드)

## 작업 순서

1. **사이드카 프로세스 제어**: ShimmyProcessManager 초안 구현 및 포트/헬스체크 로직 단위 테스트 작성.
2. **하드웨어 감지 및 모델 레지스트리**: AccelDetector와 ModelRegistry를 구현하고 테스트한다.
3. **OpenAI 래퍼 및 통합 테스트**: 스트리밍 클라이언트 래퍼, 통합 테스트 스텁, 문서 업데이트를 수행한다.
