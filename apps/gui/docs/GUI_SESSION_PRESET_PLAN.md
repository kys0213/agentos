# GUI Session Preset Plan

## 요구사항

- 각 대화 세션은 사용할 프리셋을 선택할 수 있어야 한다.
- 새로운 세션을 시작할 때 프리셋을 선택할 수 있지만 필수는 아니다.
- 대화 중에도 프리셋을 변경할 수 있어야 한다.
- 이전에 저장된 세션을 다시 열면 해당 프리셋이 적용된 상태여야 한다.

## 인터페이스 초안

```ts
// packages/gui/src/renderer/PresetSelector.tsx
interface PresetSelectorProps {
  presets: Preset[];
  value?: string; // preset id
  onChange(id: string): void;
}

// packages/core/src/chat/file/file-based-chat-session.ts
// preset 속성에 setter 추가
```

## Todo

- [x] `FileBasedChatSession`에 `preset` setter 구현
- [x] `PresetSelector` 컴포넌트 작성 (Chakra `Select` 적용)
- [x] `ChatApp`에서 세션 생성 시 프리셋 선택 옵션 제공
- [x] 대화 중 드롭다운으로 프리셋 변경 후 `session.commit()` 호출
- [x] 세션 로드 시 저장된 프리셋을 초기값으로 설정
- [x] `pnpm lint` 와 `pnpm test` 실행

## 작업 순서

1. `PresetSelector` 컴포넌트 구현 및 테스트
2. `FileBasedChatSession`에 preset setter 추가
3. `ChatApp` 상태에 선택한 프리셋 저장하고 세션 생성/변경 로직 연결
4. 기존 세션을 로드할 때 프리셋을 화면에 표시
5. 린트와 테스트 후 커밋
