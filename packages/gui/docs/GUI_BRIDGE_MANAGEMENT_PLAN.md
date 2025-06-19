# GUI LLM Bridge Management Plan

## 요구사항

- 설정 화면에서 LLM bridge 목록을 볼 수 있어야 한다.
- 새 LLM bridge 를 추가할 수 있어야 한다.
- 기존 LLM bridge 를 삭제할 수 있어야 한다.

## 인터페이스 초안

```ts
// packages/gui/src/renderer/llm-bridge-store.ts
export interface LlmBridgeConfig {
  id: string;
  type: 'echo' | 'reverse';
}
export class LlmBridgeStore {
  list(): LlmBridgeConfig[];
  save(config: LlmBridgeConfig): void;
  delete(id: string): void;
}

// packages/gui/src/renderer/LlmBridgeManager.tsx
interface LlmBridgeManagerProps {
  store: LlmBridgeStore;
  manager: BridgeManager;
}
```

## Todo

- [ ] `LlmBridgeStore` 구현하여 electron-store 로 설정 저장
- [ ] `LlmBridgeManager` 컴포넌트 작성: 목록 표시, 추가/삭제 기능 제공
- [ ] `SettingsMenu` 에 브리지 관리 메뉴 추가
- [ ] `ChatApp` 시작 시 저장된 브리지를 로드하여 `BridgeManager` 에 등록
- [ ] 단위 테스트 추가 후 `pnpm lint` 와 `pnpm test` 실행

## 작업 순서

1. `LlmBridgeStore` 작성 및 테스트 구현
2. `LlmBridgeManager` UI 구현
3. `SettingsMenu` 와 `ChatApp` 수정하여 관리 기능 연결
4. 린트와 테스트 실행 후 커밋
