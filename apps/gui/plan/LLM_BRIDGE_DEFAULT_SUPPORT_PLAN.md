# GUI 기본 LLM 브리지 번들 계획서

## Requirements

### 성공 조건

- [ ] GUI/Electron 애플리케이션 설치 시 Ollama, OpenAI, Claude, Grok 4종 브리지가 별도 다운로드 없이 바로 활성화 가능한 상태로 제공된다.
- [ ] 번들된 브리지는 파일 기반 레지스트리(`FileBasedLlmBridgeRegistry`)에 자동 등록되고, 최초 실행 시 활성 브리지를 선택할 수 있는 UX가 메인 프로세스 API를 통해 노출된다.
- [ ] 기존 CLI/Electron 시드(E2E) 흐름은 추가 설치 절차 없이 이 4종 브리지 중 하나를 선택해 성공적으로 채팅/테스트를 수행한다.

### 사용 시나리오

- [ ] 사용자는 GUI에서 "LLM 설정" 화면을 열면 메인 프로세스 API로부터 전달받은 기본 제공 브리지 목록(Ollama, OpenAI, Claude, Grok)과 활성 여부를 확인하고, 필요한 API 키/엔드포인트만 입력해 사용할 수 있다.
- [ ] Electron 시드 스크립트(`seed-backend`)는 메인 서비스가 번들 브리지를 자동 등록/활성화해두므로 Echo 시나리오를 바로 검증할 수 있다.
- [ ] CLI 사용자는 `agentos bridge list` 명령으로 번들된 브리지 설치 상태를 확인하고, `bridge activate`로 기본 브리지를 전환할 수 있다.

### 제약 조건

- [ ] 앱 크기 증가와 라이선스(특히 Grok/Claude SDK) 검수가 필요하며, 각 브리지 패키지의 배포 권한과 버전을 명확히 고정해야 한다.
- [ ] Ollama 브리지는 로컬 Ollama 서버를 전제로 하므로, 해당 바이너리가 없을 때의 에러 처리/가이드가 필요하다.
- [ ] OpenAI/Claude/Grok 브리지는 API 키가 없으면 동작하지 않으므로, GUI 내 키 입력 UX와 보안 저장소를 재검토한다.
- [ ] 번들 대상 패키지들은 `/Users/irene/Documents/llm-bridge/packages` 에서 개발되고 npm에 `ollama-llm-bridge`, `openai-llm-bridge`, `claude-llm-bridge`, `grok-llm-bridge` 이름으로 배포된 상태이므로, GUI `package.json`에 의존성만 추가하면 바로 import 가능하다.

## Interface Sketch

```typescript
// packages/core/src/llm/bridge/bundled/load-bundled-bridges.ts
// 실제 패키지는 /Users/irene/Documents/llm-bridge/packages 에서 개발되고
// npm 에 `*-llm-bridge` 네이밍으로 배포되어 있다.
// DependencyBridgeLoader.scan 이 package.json 의존성을 바탕으로 자동 탐색한다.

const loader = new DependencyBridgeLoader();

export async function loadBundledBridges(registry: LlmBridgeRegistry, cwd: string) {
  const results = await loader.scan({ cwd, includeDev: false });

  for (const { manifest, ctor } of results) {
    try {
      const config = getDefaultConfig(manifest);
      await registry.register(manifest, config, { id: manifest.name });
      createdBridgeCache.set(manifest.name, new ctor(config));
    } catch (error) {
      console.error(`[bridge] ${manifest.name} 등록 실패`, error);
    }
  }
}
// 메인 프로세스 API (Electron/Nest NestJS 컨트롤러 예시)
@EventPattern('llm.bridge.list')
async listBundled() {
  const summaries = await this.registry.listSummaries();
  const active = await this.registry.getActiveId();

  return summaries.map((summary) => ({
    id: summary.id,
    name: summary.name,
    description: summary.description,
    active: summary.id === active,
  }));
}
```

## Todo

- [ ] 4종 브리지(npm 패키지) 의존성 확정 및 `apps/gui/package.json`에 추가
- [ ] `llm-bridge-loader`를 GUI(Electron 메인) 의존성에 추가하고 DependencyBridgeLoader를 사용할 수 있도록 빌드 환경에 포함 (현 로컬 개발 경로: `/Users/irene/Documents/llm-bridge/packages`)
- [ ] DependencyBridgeLoader.scan 을 활용해 `package.json` 의 `*-llm-bridge` 의존성을 자동 탐색하고, 개발/배포 환경별 `cwd` 지정 방식을 확정
- [ ] `FileBasedLlmBridgeRegistry`에 번들 브리지 자동 등록 로직 추가 (중복 설치 방지, 활성화 기본값 설정)
  - [x] Ollama 브리지 기본 구성 및 자동 등록 (2025-10-13)
- [ ] Electron 시드/CLI가 번들 브리지를 사용하는 서비스 API로 전환 (설치 절차 제거)
- [ ] 메인 프로세스에 `llm.bridge.*` RPC/IPC 엔드포인트 추가, 렌더러는 API만 소비하도록 수정 (렌더러는 브리지 존재 자체를 몰라도 됨)
- [ ] GUI 설정 화면에 브리지 목록/키 입력 UI 추가 및 상태 표시
- [ ] 테스트: 번들 로딩 단위 테스트 + Electron End-to-End 시나리오 업데이트
  - [x] 번들 로딩 단위 테스트 (2025-10-13)
  - [x] Ollama 번들 E2E 플로우 검증 (E2E_OLLAMA=true, 2025-10-13)
- [ ] 문서: README, docs/frontend/testing.md, CLI/GUI 사용자 가이드 업데이트

## 작업 순서

1. **1단계**: 브리지 패키지 확정 및 번들 로딩 구조 설계
 - `package.json` 의존성 추가, 프리빌드 스크립트로 `*-llm-bridge` 목록 생성
  - `loadBundledBridges`에서 DependencyBridgeLoader.scan 결과를 등록하고, 앱 루트(cwd) 탐색 전략 정리
  - 추후 CLI 등 다른 소비자가 필요하면 별도의 shared bridge-installer 패키지로 분리 검토 (core 의존성 최소화)
2. **2단계**: 메인 프로세스 서비스와 CLI/시드 연동
   - Electron 시드(`seed-backend`)가 번들 브리지를 자동 등록/활성화
   - CLI `bridge list/activate`가 메인 서비스 API를 통해 번들 항목을 노출하도록 조정
3. **3단계**: GUI UX & 문서 정리
   - 렌더러는 메인 API만 호출하도록 갱신 (브리지 모듈 직접 import 필요 없음)
   - 설정 화면 UX에서 브리지 상태/설정 노출, API 키 저장 전략 명확화
   - 테스트/E2E 갱신, 문서 업데이트 후 QA
