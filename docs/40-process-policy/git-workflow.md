# Git Workflow Guide

## 🎯 **브랜치 전략**

### **브랜치 명명 규칙**

```bash
# UX 기능 개발
feature/ux-command-palette
feature/ux-session-management
feature/ux-message-search

# 컴포넌트 개발
feature/component-fab-system
feature/component-settings-panel

# core 로직 개발
feature/redis-chat-session-storage
feature/new-

# 버그 수정
fix/chatapp-state-sync
fix/css-grid-layout

# 성능 최적화
perf/virtual-scrolling
perf/bundle-splitting

# 리팩터링
refactor/component-separation
refactor/state-management
```

### **브랜치 생성 및 작업**

````bash
# 1. 최신 main 브랜치로 전환
git checkout main
git pull origin main

# 2. 새 기능 브랜치 생성
git checkout -b feature/ux-command-palette

# 3. push 전 검증 (포맷 포함)
pnpm format      # Prettier 포맷 적용 — 변경분을 반드시 커밋에 포함!
pnpm lint        # 자동 수정(--fix) 포함해 실행 권장 (에러 0, 경고 최소화)
pnpm typecheck   # 타입 오류 없도록 보장
pnpm test        # 단위 테스트 통과 확인

# 4. 작업 완료 후 Pull Request 생성 - 절대 직접 병합 금지!
git push origin feature/ux-command-palette


# 5. GitHub에서 Pull Request 생성 (PR 템플릿 기반)

반드시: GitHub 웹 UI에서 PR을 생성하여 `.github/pull_request_template.md`가 자동 적용되도록 합니다. PR 본문은 반드시 "계획서(Plan) 기반"으로 작성합니다.

CLI를 사용할 경우에도 템플릿을 강제 적용해야 합니다. 생성 시 `--body-file .github/pull_request_template.md`를 사용하고, 본문을 계획서 중심으로 즉시 채워 넣습니다.

```bash
# 기본 PR 생성 (브라우저에서 템플릿 자동 적용)
gh pr create --title "Add Command Palette system" --web

# 또는 템플릿 파일을 본문으로 채우고 수정을 위해 브라우저 열기(필수)
gh pr create --title "Add Command Palette system" \
  --body-file .github/pull_request_template.md --web
````

# ⚠️ 중요: 절대 git merge 명령어 사용 금지!

# ⚠️ 모든 병합은 Pull Request를 통해서만!

````

## 📝 **TODO별 커밋 전략**

### **커밋 메시지 규칙**

```bash
# TODO 완료 시
✅ [TODO 1/5] Add Command Palette basic structure

# 중간 진행 시
🚧 [TODO 2/5] WIP: Implement keyboard shortcuts for Command Palette

# TODO 완료 시
✅ [TODO 2/5] Complete keyboard shortcut implementation

# 전체 기능 완료 시
🎉 [FEATURE] Complete Command Palette system implementation
````

### **실제 작업 예시**

```bash
# Command Palette 기능 개발 예시

# 1. 브랜치 생성
git checkout -b feature/ux-command-palette

# 2. TODO 1 완료 후 커밋
git add .
git commit -m "✅ [TODO 1/4] Add kbar library integration and basic setup"

# 3. TODO 2 완료 후 커밋
git add .
git commit -m "✅ [TODO 2/4] Implement command actions and keyboard shortcuts"

# 4. TODO 3 완료 후 커밋
git add .
git commit -m "✅ [TODO 3/4] Add command categories and search functionality"

# 5. TODO 4 완료 후 커밋
git add .
git commit -m "✅ [TODO 4/4] Complete Command Palette integration with app state"

# 6. 기능 완료 커밋
git add .
git commit -m "🎉 [FEATURE] Complete Command Palette system implementation

- Cmd+K keyboard shortcut for instant access
- Categories: chat, settings, navigation, mcp
- Real-time search with fuzzy matching
- Context-aware command suggestions
- Integration with app state and navigation

Resolves: GUI_CYCLIC_UX_REDESIGN_PLAN.md Phase 1 Task 1"
```

## 🔄 **작업 흐름**

### **새 기능 시작 시**

1. **계획서 확인**: 해당 `GUI_*_PLAN.md` 문서의 TODO 리스트 검토
2. **브랜치 생성**: 기능명에 맞는 브랜치 생성
3. **TODO 단위 작업**: 각 TODO 완료 시마다 커밋
4. **테스트 실행**: `pnpm lint` && `pnpm test` 통과 확인
5. **문서 업데이트**: 완료된 TODO 체크 후 커밋
   - Plan→Docs 승격을 PR 생성 전에 완료합니다. 승격된 문서 경로를 PR 본문에 기재하세요.
6. **Pull Request 생성**: PR 템플릿 기반으로 생성하고, 본문은 "Plan 중심 요약"으로 작성
   - Context: Plan 링크(`plan/<file>.md` 또는 승격 후 `docs/<file>.md`), Scope
   - Docs: Plan→Docs 승격이 완료되었는지 확인(필수). 경로를 명시하세요.
   - Requirements: 계획서의 성공조건 요약(3~5줄)
   - TODO Status: 계획서의 TODO 목록 복사 + 완료 체크 표시
   - Changes: 핵심 변경사항 불릿(3~7개)
   - Verification: `pnpm -r typecheck | test | build` 결과 요약
   - Docs: Plan→Docs 승격 여부/경로, 기존 유사 문서 병합/확장 여부
   - PR 유형별 문서 원칙:
     - Feature/Fix: 변경된 인터페이스/동작에 맞게 기존 문서를 반드시 갱신
     - Refactor/Perf/Chore: 외부 인터페이스 변화가 없으면 문서 갱신 생략 가능(Plan만 삭제). 변화가 있다면 문서 갱신 필수
   - Risks/Notes: 브레이킹/제약/후속작업
   - 길고 일반적인 가이드 복붙은 금지. 반드시 계획서 준수/검증 중심으로 작성
7. **브랜치 유지**: PR 승인까지 브랜치 절대 삭제 금지

## 🚨 **절대 금지 사항**

### **❌ 직접 병합 금지**

```bash
# ❌ 절대 사용 금지 명령어들
git checkout main
git merge feature/branch-name  # 절대 금지!
git push origin main           # 절대 금지!
git branch -d feature/branch   # PR 승인 전 절대 금지!
```

### **✅ 올바른 완료 프로세스**

```bash
# 1. 브랜치에서 작업 완료
git push origin feature/branch-name

# 2. Pull Request 생성 (PR 템플릿 기반, Plan 중심 작성)
gh pr create --web

# 3. PR 승인까지 대기 (브랜치 유지)
# 4. 승인 후 GitHub에서 Merge
# 5. 그 후에만 로컬 브랜치 정리
```

### **코드 리뷰 기준**

- **브랜치별 리뷰**: 전체 기능 단위로 종합 검토
- **커밋별 리뷰**: TODO 단위의 세부 변경사항 검토
- **문서 동기화**: 계획서의 TODO 체크와 실제 구현 일치 확인
- **Plan→Docs 승격**: 모든 TODO 완료 시(= PR 생성 전) `plan/` 문서를 `docs/`로 승격하고 원본 삭제(Deprecated 디렉토리 금지). 유사 문서는 병합/확장.
- **Interface-first 문서**: 최종 문서는 인터페이스/계약/시나리오를 우선하며, 내부 구현 세부는 문서 대상이 아님.

> Tip
> CI 가드(선택): PR 본문에 Plan 링크가 없거나, `FEATURE` 커밋이 있는데 `plan/` 파일이 남아있는 경우 실패하도록 GitHub Actions/Danger로 검증하는 것을 권장합니다.

## 📊 **품질 관리**

### **커밋 전 체크리스트**

```bash
# 자동화된 체크
pnpm lint      # 코드 스타일 검증 (자동 수정 적용 시 변경 파일 반드시 커밋)
pnpm typecheck # 타입 오류 검증
pnpm test      # 단위 테스트 실행
pnpm build     # 빌드 오류 확인
```

> Note
>
> - `pnpm format` → `git status` → 변경 사항을 반드시 스테이지/커밋하세요. 포맷 변경이 누락되면 PR에서 불일치가 발생합니다.
> - `pnpm lint --fix` 실행 후에도 변경 파일 여부를 `git status`로 확인하고, 포맷과 함께 커밋에 포함합니다.
> - 린트 에러/경고로 인한 의미 없는 잡음 방지를 위해, 자동 수정으로 해결 가능한 항목은 즉시 반영하고 커밋합니다.

### **권장 자동화(선택)**

- pre-commit 훅으로 `pnpm format && pnpm lint`를 실행하여 포맷 누락을 방지합니다.(husky 등)
- CI에서 PR에 포맷/린트 오류가 있으면 실패하도록 Guard를 추가합니다.

### **GUI 테스트 정책 (Playwright MCP)**

- GUI(Electron/Web) 기능 검증은 E2E 테스트 추가 대신 dev 서버 + Playwright MCP로 디버깅합니다.
- 실행 절차:
  - `cd apps/gui && pnpm dev:web` 로 서버 기동
  - Playwright MCP 스크립트로 브라우저를 구동해 시나리오 검증
- 세부 가이드는 `apps/gui/docs/PLAYWRIGHT_MCP_GUIDE.md`를 따르세요.
- 참고용 E2E 스펙은 문서적 레퍼런스로만 유지하며, 신규 작성 금지.

# 수동 체크

- [ ] TODO 항목이 완전히 완료되었는가?
- [ ] 관련 문서가 업데이트되었는가?
- [ ] 다른 기능에 영향을 주지 않는가?

### **Pull Request 생성 전 체크리스트**

- [ ] 모든 TODO가 완료되었는가?
- [ ] 계획서의 성공 조건을 만족하는가?
- [ ] 통합 테스트가 통과하는가?
- [ ] 문서가 최신 상태로 업데이트되었는가?
- [ ] 브랜치가 원격에 푸시되었는가?
- [ ] PR 제목과 설명이 명확한가?

### **Pre-push 품질 체크(권장)**

```bash
pnpm -r typecheck
pnpm -r lint -- --max-warnings=0
npx ts-prune  # dead export 확인
```

### **리뷰 체크리스트(요약)**

- [ ] any 사용 없음(unknown + 타입가드/제네릭/Adapter로 대체)
- [ ] dead code/미사용 export 없음(ts-prune/ESLint)
- [ ] 컨테이너/프레젠테이션 분리(프레젠테이션은 동기 props만)
- [ ] IPC fetcher는 ServiceContainer + Protocol만 호출하며 DTO 매핑 수행
- [ ] React Query queryKey 표준 사용 및 invalidate 일관성

### **Pull Request 승인 대기 중 체크리스트**

- [ ] 브랜치를 삭제하지 않았는가?
- [ ] main 브랜치로 전환하지 않았는가?
- [ ] 추가 수정사항이 있다면 같은 브랜치에 커밋했는가?

## 🚀 **필수 Git Hooks 설정 (CI 실패 방지)**

### **⚡ 자동 설정 스크립트**

```bash
# 프로젝트 루트에서 실행 - 모든 필수 hooks 한번에 설정
./.scripts/setup-git-hooks.sh
```

### **🔧 수동 Git Hooks 설정**

#### **1. pre-push hook (🚨 필수 - CI 실패 방지)**

```bash
#!/bin/sh
# .git/hooks/pre-push
echo "🔍 Running pre-push checks..."

# 1. 포맷팅 검사 및 자동 수정
echo "📝 Running formatter..."
pnpm format
if [ $? -ne 0 ]; then
    echo "❌ Format failed. Please fix formatting issues."
    exit 1
fi

# 2. 린트 검사
echo "🔍 Running linter..."
pnpm lint
if [ $? -ne 0 ]; then
    echo "❌ Lint failed. Please fix linting issues before pushing."
    exit 1
fi

# 3. 타입 체크
echo "🔧 Running type check..."
pnpm typecheck
if [ $? -ne 0 ]; then
    echo "❌ Type check failed. Please fix type errors before pushing."
    exit 1
fi

# 4. 테스트 실행 (선택적)
echo "🧪 Running tests..."
pnpm test
if [ $? -ne 0 ]; then
    echo "⚠️  Some tests failed. Consider fixing before pushing."
    # 테스트 실패는 경고만 (exit 하지 않음)
fi

# 5. 빌드 검증
echo "🏗️  Running build..."
pnpm build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before pushing."
    exit 1
fi

echo "✅ All pre-push checks passed!"
```

#### **2. pre-commit hook (권장)**

```bash
#!/bin/sh
# .git/hooks/pre-commit
echo "🔍 Running pre-commit checks..."

# 스테이징된 파일만 검사
pnpm lint-staged
if [ $? -ne 0 ]; then
    echo "❌ Lint-staged failed. Please fix issues and re-add files."
    exit 1
fi

echo "✅ Pre-commit checks passed!"
```

### **커밋 템플릿**

```bash
# .gitmessage
# 📋 [TODO x/y] 간단한 설명
#
# 상세 설명:
# - 구현된 기능
# - 변경된 파일들
# - 테스트 결과
#
# 관련 문서: GUI_*_PLAN.md
```

---

## 💡 **핵심 원칙**

1. **작은 단위, 자주 커밋**: TODO별로 명확한 진행상황 추적
2. **의미있는 커밋 메시지**: 나중에 히스토리를 추적하기 쉽게
3. **문서와 코드 동기화**: 계획서의 TODO와 실제 구현 일치
4. **품질 우선**: 각 단계에서 테스트와 린트 통과 필수
5. **🚨 Pull Request Only**: 모든 병합은 반드시 Pull Request를 통해서만
6. **🚨 브랜치 보호**: PR 승인 전까지 브랜치 절대 삭제 금지

### **📋 Git Hooks 설치 방법**

#### **자동 설치 (권장)**

```bash
# 프로젝트 루트에서 한 번만 실행
./.scripts/setup-git-hooks.sh
```

#### **수동 설치**

1. 위의 pre-push hook 스크립트를 `.git/hooks/pre-push`에 저장
2. 실행 권한 부여: `chmod +x .git/hooks/pre-push`
3. pre-commit hook도 동일하게 설정

### **🎯 Hook 동작 방식**

**Pre-push Hook가 실행하는 검사:**

1. **포맷팅**: `pnpm format` (자동 수정 + 커밋 요구)
2. **린트**: `pnpm lint` (실패 시 push 차단)
3. **타입체크**: `pnpm typecheck` (실패 시 push 차단)
4. **빌드**: `pnpm build` (실패 시 push 차단)
5. **테스트**: `pnpm test` (실패 시 경고만)
6. **브랜치 보호**: main 브랜치 직접 push 차단

**실패 시 대응 방법:**

```bash
# 1. 린트 에러 자동 수정 시도
pnpm lint --fix

# 2. 포맷팅 자동 수정 후 커밋
pnpm format
git add .
git commit --amend --no-edit

# 3. 타입 에러는 수동으로 수정 필요
pnpm typecheck

# 4. 급한 경우 hook 우회 (비권장)
git push --no-verify
```

## ⚠️ ** Coding Agent 사용 시 필수 지침**

### **🔧 Coding Agent 작업 전 확인사항**

**✅ Coding Agent 가 반드시 해야 할 작업:**

1. **브랜치 생성**: `git checkout -b feature/descriptive-name`
2. **품질 검사**: 모든 변경 후 `pnpm lint && pnpm typecheck && pnpm build`
3. **TODO별 커밋**: 각 TODO 완료 시마다 의미있는 커밋
4. **Hook 통과 확인**: push 전 pre-push hook 성공 확인
5. **PR 생성**: `gh pr create`로 Pull Request 생성

**❌ Coding Agent 가 절대 해서는 안 되는 작업:**

1. `git merge` 명령어 실행
2. `git checkout main` 후 병합 작업
3. `git branch -d` 로 브랜치 삭제 (PR 승인 전)
4. `git push origin main` 직접 푸시
5. `git push --no-verify` Hook 우회 푸시
6. Lint/타입 에러 무시하고 진행

### **🚨 실패 시 대응 절차**

```bash
# 1. 문제 파악
echo "Hook failed - checking issues..."

# 2. 자동 수정 시도
pnpm lint --fix
pnpm format

# 3. 변경사항 커밋
git add .
git commit --amend --no-edit

# 4. 타입 에러 수정 (수동)
pnpm typecheck
# 에러 수정 후
git add .
git commit --amend --no-edit

# 5. 재시도
git push origin feature-branch
```

### **💡 품질 보장 체크리스트**

모든 커밋 전:

- [ ] `pnpm lint` 통과
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm build` 통과
- [ ] 의미있는 커밋 메시지 작성
- [ ] TODO별 단위 커밋 확인

Push 전:

- [ ] Pre-push hook 성공
- [ ] 브랜치명이 적절한가
- [ ] main 브랜치가 아닌가
- [ ] PR 준비 완료

**이 지침을 통해 CI 실패 없는 안전하고 품질 높은 개발을 보장합니다.**
