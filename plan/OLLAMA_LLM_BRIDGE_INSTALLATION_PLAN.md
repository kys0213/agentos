# Ollama LLM Bridge 설치 플로우 계획서

## Requirements

### 성공 조건

- [ ] `agentos` CLI 또는 내부 API를 통해 `ollama-llm-bridge` npm 패키지를 지정 디렉터리(`/Users/irene/Documents/llm-bridge/packages/ollama-llm-bridge` 등 로컬 캐시 포함)에 설치하고, 설치 직후 `FileBasedLlmBridgeRegistry`에 자동 등록 및 활성화가 완료된다.
- [ ] 설치된 브리지는 `llm-bridge-loader`를 통해 즉시 로드 가능하며, `agentos` 실행/테스트(E2E 시드 및 CLI chat)에서 Ollama 모델 호출이 정상 동작한다.
- [ ] 설치/삭제/목록/활성화 전환 흐름이 모두 CLI/프로그래밍 API로 제공되고, 실패 시 명확한 에러와 롤백 전략을 갖는다.

### 사용 시나리오

- [ ] 사용자는 `agentos bridge install ollama-llm-bridge` 명령을 실행해 npm 레지스트리나 지정 경로에서 브리지를 설치하고, 이후 `bridge list`에서 상태와 버전을 확인한다.
- [ ] 설치 직후 `agentos chat --bridge ollama` 혹은 GUI/Electron 시드 스크립트가 Ollama 브리지를 기본 활성 브리지로 활용하여 Echo 시나리오 이상을 재현한다.
- [ ] 필요 시 `agentos bridge uninstall ollama-llm-bridge`로 제거하거나, `agentos bridge activate <id>`로 다른 브리지로 전환할 수 있다.

### 제약 조건

- [ ] 설치 경로는 macOS 기준 `/Users/irene/Documents/llm-bridge/packages/ollama-llm-bridge`를 우선 지원하되, 추후 다른 OS/커스텀 경로를 확장 가능하도록 설계한다.
- [ ] 설치 작업은 네트워크 의존(NPM fetch)이므로 오프라인 모드 또는 로컬 tgz 파일 설치 옵션을 고려해야 한다.
- [ ] 브리지 로더(`DependencyBridgeLoader`)와 레지스트리(`FileBasedLlmBridgeRegistry`)의 캐시/생명주기를 해치지 않도록 호환성 검증이 필요하다.

## Interface Sketch

```typescript
// packages/core/src/llm/bridge/installer/bridge-installer.ts
export interface BridgeInstallSpec {
  packageName: string; // 'ollama-llm-bridge'
  version?: string;    // '^0.0.7' | 'latest'
  registryUrl?: string;
  localPath?: string;  // optional: /Users/.../packages/ollama-llm-bridge
}

export interface InstalledBridgeInfo {
  id: string;
  manifest: LlmManifest;
  installPath: string;
  active: boolean;
}

export class BridgeInstaller {
  constructor(private readonly env: { bridgeHome: string; packageManager: 'pnpm' | 'npm' });

  async install(spec: BridgeInstallSpec): Promise<InstalledBridgeInfo> {
    const resolvedPath = await this.packageFetcher.fetch(spec);
    const loadResult = await this.bridgeLoader.loadFromPath(resolvedPath);
    await this.registry.register(loadResult.manifest, spec.config ?? {}, { id: loadResult.manifest.name });
    return {
      id: loadResult.manifest.name,
      manifest: loadResult.manifest,
      installPath: resolvedPath,
      active: (await this.registry.getActiveId()) === loadResult.manifest.name,
    };
  }

  async uninstall(id: string): Promise<void> {
    await this.registry.unregister(id);
    await this.packageFetcher.remove(id);
  }
}

// CLI 명령 예시 (apps/cli/src/bridge/install.ts)
program
  .command('bridge install <package>')
  .option('-v, --version <range>', 'npm semver range', 'latest')
  .option('--local <path>', '로컬 디렉터리에서 설치')
  .action(async (pkg, opts) => {
    const installer = createBridgeInstaller();
    const info = await installer.install({ packageName: pkg, version: opts.version, localPath: opts.local });
    console.log(`Installed bridge ${info.id} at ${info.installPath}`);
  });
```

## Todo

- [ ] 설치 대상 패키지 관리용 `BridgePackageFetcher`(npm install/로컬 경로 symlink) 구현
- [ ] `FileBasedLlmBridgeRegistry` 확장: 설치 메타데이터와 패키지 경로 동기화, 활성 브리지 자동 설정 로직 검증
- [ ] CLI/프로그램 API (`agentos bridge install|uninstall|list|activate`) 작성 및 기존 시드 스크립트 연동
- [ ] 테스트 작성 (단위 테스트): fetcher/installer/registry 상호작용 Mock
- [ ] 테스트 작성 (통합 테스트): 실제 npm install (mock registry) 또는 로컬 경로 기반 end-to-end
- [ ] 문서 업데이트: README, docs/frontend/testing.md, CLI 사용법, Electron 시드 가이드

## 작업 순서

1. **1단계**: 의존성 파악 및 설치 디렉터리 설계 (Todo 첫 두 항목)
   - Bridge 설치 홈(`~/.agentos/bridges` or 프로젝트 내 `.agentos/bridges`) 결정
   - `BridgePackageFetcher` 초안 + 단위 테스트 작성
2. **2단계**: 레지스트리/로더 통합과 CLI 엔트리포인트 구현 (Todo 3-4)
   - Installer ↔ Registry + CLI 명령 연결
   - `ollama-llm-bridge` 설치/활성화 happy path 통합 테스트 작성
3. **3단계**: 문서화 및 시드/GUI 연동 (Todo 5-6)
   - Electron 시드가 새 Installer API를 사용하도록 수정
   - 사용자 문서에 설치 흐름 추가, 최종 self-test
