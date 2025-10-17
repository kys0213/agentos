# 작업계획서: Docs Bundling Automation

## Requirements

### 성공 조건

- [x] docs 하위 주요 디렉토리(00-start-here, 10-architecture, 20-specs, 30-developer-guides, 40-process-policy)의 Markdown을 자동으로 취합하는 스크립트를 제공한다.
- [x] 스크립트 실행 결과가 별도 산출물 디렉토리에 `*.md` 파일로 생성된다.
- [x] README 또는 문서에 사용 방법을 기록해 팀원이 재사용 가능하도록 한다.

### 사용 시나리오

- [x] 외부 공유용으로 문서를 한 번에 전달해야 할 때 산출물을 즉시 생성한다.
- [x] 새로운 문서가 추가되어도 스크립트를 재실행하여 최신 산출물을 받을 수 있다.

### 제약 조건

- [x] 원본 문서를 수정하거나 이동하지 않는다.
- [x] 산출물 디렉토리는 명확히 구분되고 git 추적과 충돌이 없도록 `.gitignore` 설정을 검토한다.

## Interface Sketch

```bash
pnpm docs:bundle
# => outputs to exports/doc-bundles/<bundle-name>.md
```

## Todo

- [x] 포함 대상 디렉토리 목록과 출력 레이아웃을 정의한다.
- [x] Node 스크립트를 작성해 Markdown을 병합한다.
- [x] `package.json`에 실행 스크립트를 추가하고 사용 방법을 문서화한다.
- [x] 초기 실행으로 산출물을 생성하여 검토한다.
- [x] 필요한 경우 `.gitignore` 업데이트를 검토한다.
- [x] 테스트 작성 (단위 테스트) - 이번 작업은 스크립트이므로 생략.
- [x] 테스트 작성 (통합 테스트) - 수동 확인으로 대체한다.
- [x] 문서 업데이트 - 사용 설명을 추가한다.

## 작업 순서

1. **설계**: 번들 구성과 출력 경로 결정 (완료 조건: 포함 목록/Output 경로 확정).
2. **구현**: 스크립트 및 실행 명령 작성 (완료 조건: `pnpm docs:bundle`가 동작).
3. **생성 및 문서화**: 산출물 생성 후 README/관련 문서에 안내 추가 (완료 조건: Todo 체크 완료).
