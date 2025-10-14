# 작업계획서: Legacy Slack Bot Artifacts Cleanup

## Requirements

### 성공 조건

- [x] `apps/agent-slack-bot` 디렉터리를 정리하여 레거시 빌드 산출물을 제거한다.
- [x] 기존 Slack Bot 소스(`apps/slack-bot`)에 영향이 없는지 확인한다.
- [x] README 및 Docs에 남은 레거시 언급이 정리 상태를 반영한다.

### 사용 시나리오

- [x] 신규 기여자가 중복 디렉터리 없이 최신 구조만 인지한다.

### 제약 조건

- [x] 실소스가 없는 산출물만 제거한다.

## Todo

- [x] `apps/agent-slack-bot` 내부 내용을 확인한다.
- [x] 제거가 프로젝트에 영향 없는지 검증한다.
- [x] 디렉터리를 삭제하고 git 상태를 확인한다.
- [x] README/docs 설명을 재검토한다.

## 작업 순서

1. 산출물 디렉터리 확인.
2. 삭제 후 상태 점검.
3. 문서 재검토.
