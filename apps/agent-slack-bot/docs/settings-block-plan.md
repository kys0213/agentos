# Settings Block Plan

## 요구사항

- 슬랙 봇의 설정 화면을 렌더링하기 위한 Block 구성 함수를 작성한다.
- block 구성은 `slack-block-builder` 패키지를 이용하여 간결하게 표현한다.

## 인터페이스 초안

```ts
// packages/agent-slack-bot/src/settings-block.ts
export function getSettingsBlocks(): KnownBlock[];
```

## Todo

- [ ] `slack-block-builder` 의존성 추가
- [ ] `getSettingsBlocks` 구현: 섹션 헤더와 닫기 버튼을 포함한 blocks 반환
- [ ] 단위 테스트 작성
- [ ] `pnpm lint` 와 `pnpm test` 실행 후 커밋

## 작업 순서

1. 패키지 의존성 업데이트 후 설치
2. `settings-block.ts` 파일에 함수 구현
3. Jest 테스트 작성하여 결과 검증
4. 문서에 사용법과 의존성 추가 사실 기록
