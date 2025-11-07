# Shimmy 사이드카 통합 가이드

Shimmy 사이드카를 AgentOS 애플리케이션에서 제어하려면 `@agentos/shimmy-manager` 패키지를 사용합니다. 이 가이드는 사이드카 프로세스 기동부터 OpenAI 호환 클라이언트 구성, 모델 레지스트리 연동까지의 흐름을 정리합니다.

## 주요 모듈

- `ShimmyProcessManagerImpl`: shimmy 바이너리 스폰, 포트 탐색, 헬스체크, 런타임 재시작을 담당하는 프로세스 매니저입니다.
- `ShimmyProcessDefaults`: 재시작 한도, 헬스체크 주기, 종료 그레이스 타임 등 프로세스 제어에 필요한 상수를 중앙집중식으로 제공합니다.【F:packages/shimmy-manager/src/process-manager-defaults.ts†L1-L8】
- `DefaultAccelDetector`: OS 및 GPU 상태를 점검하여 shimmy 실행에 적합한 가속 플래그를 추천합니다.
- `ShimmyModelRegistryImpl`: `shimmy list` 결과를 파싱해 로컬 모델을 조회하고, 기본 모델 보장 로직을 제공합니다.
- OpenAI 호환 호출은 `openai-llm-bridge`가 제공하는 브리지 팩토리를 활용하여 baseURL을 shimmy 사이드카로 지정해 재사용합니다.【F:apps/gui/node_modules/openai-llm-bridge/dist/index.d.ts†L1-L30】【F:apps/gui/node_modules/openai-llm-bridge/README.md†L12-L59】
- `ShimmyError`, `ShimmyErrorCode`: 모든 실패 상황을 일관된 오류 코드로 표현합니다.

## 빠른 시작

```typescript
import {
  DefaultAccelDetector,
  ShimmyProcessManagerImpl,
  ShimmyModelRegistryImpl,
  resolveRequestedGpuMode,
} from '@agentos/shimmy-manager';
import { createOpenAIBridge } from 'openai-llm-bridge';

const detector = new DefaultAccelDetector();
const processManager = new ShimmyProcessManagerImpl();
const registry = new ShimmyModelRegistryImpl({
  shimmyPath: '/Applications/Shimmy/bin/shimmy',
  modelsDir: `${process.env.HOME}/.agentos/models`,
});

async function bootstrapShimmy(defaultModel: string) {
  const gpuMode = await resolveRequestedGpuMode('auto', detector);

  await registry.ensureDefault(defaultModel, async (modelId, targetDir) => {
    // TODO: 라이선스 동의 후 모델 다운로드 로직 구현
    console.log(`Download ${modelId} into ${targetDir}`);
  });

  await processManager.start({
    shimmyPath: '/Applications/Shimmy/bin/shimmy',
    preferredPort: 11435,
    modelsDir: `${process.env.HOME}/.agentos/models`,
    args: ['serve'],
    gpuMode,
    healthTimeoutMs: 120_000,
  });
  await processManager.ensureReady();

  const port = processManager.getPort();
  if (!port) {
    throw new Error('Shimmy port was not assigned.');
  }

  const localBridge = createOpenAIBridge({
    apiKey: 'sk-local',
    baseURL: `http://127.0.0.1:${port}/v1`,
    model: defaultModel,
  });

  const response = await localBridge.invoke({
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: 'hello shimmy' }],
      },
    ],
  });

  console.log(response.choices[0]?.message?.content?.[0]?.text);
}
```

## 이벤트 및 오류 처리

`ShimmyProcessManagerImpl`는 `starting`, `ready`, `restarting`, `stopped`, `stdout`, `stderr`, `error` 이벤트를 발생시킵니다. GUI/CLI는 이 이벤트를 구독해 로딩 인디케이터, 로그 뷰어, 에러 토스트 등을 구현할 수 있습니다.

```typescript
processManager.on('stdout', (line) => console.debug('[shimmy]', line));
processManager.on('error', (error) => {
  switch (error.code) {
    case 'PORT_IN_USE':
      notify('다른 프로세스가 포트를 사용 중입니다.');
      break;
    case 'START_TIMEOUT':
      notify('Shimmy 기동이 제한 시간 내에 완료되지 않았습니다.');
      break;
    default:
      notify('Shimmy 실행 중 오류가 발생했습니다. 자세한 내용은 로그를 확인하세요.');
  }
});
```

## 모델 레지스트리 연동 팁

- `ShimmyModelRegistryImpl.listLocal()`은 JSON 및 텍스트 기반 출력 모두를 파싱합니다. shimmy 버전에 따라 출력 형식이 달라도 안전하게 목록을 얻을 수 있습니다.
- `ensureDefault`는 기본 모델이 없을 때만 다운로드 핸들러를 호출하므로, GUI에서 “모델 설치” 버튼을 눌렀을 때 동일한 헬퍼를 재사용할 수 있습니다.
- 다운로드 로직에서는 체크섬 검증, 진행률 이벤트, 라이선스 동의 기록 등을 래핑해 전달하세요.

## OpenAI 호환 클라이언트 사용 시 주의 사항

- `openai-llm-bridge`는 `baseURL` 옵션을 지원하므로 shimmy가 바인딩된 로컬 주소를 그대로 지정할 수 있습니다.【F:apps/gui/node_modules/openai-llm-bridge/dist/index.d.ts†L1-L30】
- API 키는 `sk-local`과 같이 더미 키를 사용해도 되며, 필요 시 프로젝트/조직 ID 등 추가 필드를 함께 전달할 수 있습니다.【F:apps/gui/node_modules/openai-llm-bridge/dist/index.d.ts†L4-L29】
- 스트리밍 응답이 필요한 경우 `invokeStream` 헬퍼를 활용해 토큰 단위로 UI에 전달할 수 있습니다.【F:apps/gui/node_modules/openai-llm-bridge/README.md†L35-L56】
- shimmy가 200 이외의 상태를 반환하면 `openai-llm-bridge` 측에서 예외가 발생하므로, `ShimmyProcessManager` 이벤트와 결합해 사용자에게 재시도/로그 확인을 안내하세요.

## 종료 처리

애플리케이션 종료 또는 온디바이스 모델 비활성화 시 `processManager.stop()`을 호출해 SIGTERM → SIGKILL 순으로 안전하게 종료합니다. 5초 내 종료되지 않으면 자동으로 SIGKILL이 전송됩니다.

```typescript
await processManager.stop();
```

> 참고: 구현 상세는 [docs/20-specs/shimmy-process-management.md](../20-specs/shimmy-process-management.md)에 정의된 요구사항을 준수합니다.
