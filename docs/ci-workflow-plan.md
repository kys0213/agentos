# CI Workflow Plan

## 요구사항
- Pull Request 시점에 자동으로 실행되는 CI 구성
- `pnpm install` 후 `pnpm typecheck`, `pnpm build`, `pnpm test` 순으로 수행
- Node.js 22.x 와 pnpm 8 이상 사용

## 인터페이스 초안
```yaml
# .github/workflows/ci.yml
on:
  pull_request:
    branches: ["**"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm build
      - run: pnpm test
```

## Todo
- [ ] 루트 `package.json`에 `typecheck` 스크립트 추가
- [ ] GitHub Actions 워크플로우 파일 작성
- [ ] `pnpm lint` 와 `pnpm test` 실행 후 커밋

## 작업 순서
1. `package.json` 수정하여 `typecheck` 스크립트 추가
2. `.github/workflows/ci.yml` 생성
3. 로컬에서 `pnpm lint`와 `pnpm test` 실행해 검증
4. 변경 사항 커밋
