# Slack Bot Preset Creation Plan

## 요구사항

- 슬랙 `/agentos-settings` 모달에서 Preset을 새로 생성할 수 있어야 한다.
- Preset 이름과 System Prompt만 입력 받아 간단히 저장한다.
- 저장 후에는 기존 preset 목록에 포함되어 선택할 수 있어야 한다.

## 인터페이스 초안

```ts
// packages/agent-slack-bot/src/settings-block.ts
export function getCreatePresetModal(): View;

// packages/agent-slack-bot/src/index.ts
app.action('preset-create', ...);
app.view('preset-create-modal', ...);
```

## Todo 리스트

- [ ] `getCreatePresetModal` 구현 및 테스트
- [ ] settings modal에 'Create Preset' 버튼 추가
- [ ] Slack action과 view submission 핸들러 추가
- [ ] `pnpm lint`, `pnpm build`, `pnpm test` 실행

## 작업 순서

1. UI 블록 함수와 테스트 작성
2. Slack 핸들러 로직 추가
3. 린트/빌드/테스트 실행 후 커밋
