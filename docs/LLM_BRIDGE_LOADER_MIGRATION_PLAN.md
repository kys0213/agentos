# LLM Bridge Loader Migration Plan

## Requirements

### 성공 조건

- [ ] 모든 `@agentos/llm-bridge-runner` 사용처가 `llm-bridge-loader`로 교체된다.
- [ ] `packages/llm-bridge-runner` 패키지가 저장소에서 제거된다.
- [ ] README와 문서에서 `llm-bridge-runner` 언급이 제거되거나 `llm-bridge-loader`로 대체된다.

### 사용 시나리오

- [ ] CLI와 Slack Bot에서 `llm-bridge-loader`를 통해 LLM Bridge를 동적으로 로드할 수 있다.

### 제약 조건

- [ ] 기존 기능과 빌드/테스트가 모두 통과해야 한다.

## Interface Sketch

```typescript
import { DependencyBridgeLoader } from 'llm-bridge-loader';

const loader = new DependencyBridgeLoader();
const bridge = await loader.load('openai-llm-bridge');
```

## Todo

- [ ] `apps/cli`와 `apps/agent-slack-bot`에서 `llm-bridge-loader`로 교체
- [ ] 관련 `package.json` 수정 및 의존성 설치
- [ ] `pnpm-lock.yaml` 갱신
- [ ] README 및 문서 업데이트
- [ ] `packages/llm-bridge-runner` 디렉토리 제거
- [ ] `pnpm test` 실행

## 작업 순서

1. **의존성 교체**: 각 앱의 `package.json` 수정 후 `pnpm install`
2. **코드 수정**: import 및 사용 부분을 `llm-bridge-loader`로 변경
3. **문서 업데이트 및 패키지 제거**
4. **빌드/테스트**: `pnpm test` 실행
