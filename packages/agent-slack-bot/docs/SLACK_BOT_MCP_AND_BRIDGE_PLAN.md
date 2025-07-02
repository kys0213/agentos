# Slack Bot MCP & LLM Bridge Plan

## 요구사항

- Slack 설정에서 설치된 LLM Bridge 목록을 확인할 수 있어야 한다.
- MCP 설정에서 websocket 또는 SSE 타입을 선택하고 URL을 입력할 수 있어야 한다.

## 인터페이스 초안

```ts
// packages/core/src/common/utils/list-installed-llm-bridges.ts
export function listInstalledLlmBridges(): string[];

// packages/agent-slack-bot/src/settings-block.ts
export function getMcpSettingsModal(): View;
export function getCreatePresetModal(bridges: string[]): View;
```

## Todo 리스트

- [ ] `listInstalledLlmBridges` core에 구현 및 테스트
- [ ] `getCreatePresetModal` 확장: LLM Bridge 선택, MCP 타입/URL 입력 추가
- [ ] MCP 설정 모달 UI 및 핸들러 추가
- [ ] Slack 핸들러에서 LLM Bridge 목록 로딩 및 preset 저장 시 사용
- [ ] `pnpm lint`, `pnpm build`, `pnpm test` 실행

## 작업 순서

1. 유틸 함수와 UI 블록 함수 작성 및 테스트
2. Slack 액션과 뷰 핸들러 구현
3. 린트/빌드/테스트 후 커밋
