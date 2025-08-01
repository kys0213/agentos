# GUI Directory Refactor Plan

## 요구사항

- UI 관련 파일을 명확한 계층 구조로 정리하여 유지보수성을 높인다.
- 컴포넌트, 훅, 스토어와 같이 역할별 폴더를 구분한다.
- 테스트 코드 역시 동일한 구조 하위에 위치시킨다.

## 인터페이스 초안

```
packages/gui/src/
  main.ts
  renderer/
    app/            # 앱 진입점과 레이아웃
    components/     # 재사용 가능한 React 컴포넌트
    hooks/          # React hooks
    stores/         # 설정 및 세션 관련 저장소
    bridges/        # 기본 LLM Bridge 구현
    utils/          # 기타 유틸리티 (mcp-loader, NoopCompressor 등)
    pages/          # 설정 화면 등 최상위 페이지 컴포넌트
    __tests__/      # 테스트 파일
```

## Todo

- [x] `app`, `components`, `hooks`, `stores`, `pages`, `utils` 폴더 생성
- [x] 기존 파일을 역할에 맞게 이동하고 경로 수정
- [x] 상대 경로 변경에 따른 import 문 업데이트
- [x] 테스트 코드도 동일한 위치로 옮기고 실행 확인
- [x] `pnpm lint` 와 `pnpm test` 실행

## 작업 순서

1. 새 폴더 구조를 생성한다.
2. 컴포넌트 파일과 훅 파일을 각각 `components`, `hooks` 로 분리한다.
3. 상태 저장 관련 코드를 `stores` 로 이동한다.
4. `ChatApp`과 레이아웃 관련 코드를 `app` 혹은 `pages` 로 정리한다.
5. 테스트 파일 경로를 수정하여 새 구조에 맞춘다.
6. 모든 import 경로를 업데이트한 뒤 린트와 테스트를 수행한다.
