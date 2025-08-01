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

### **브랜치 생성 및 전환**

```bash
# 1. 최신 main 브랜치로 전환
git checkout main
git pull origin main

# 2. 새 기능 브랜치 생성
git checkout -b feature/ux-command-palette

# 3. 작업 완료 후 main으로 병합
git checkout main
git merge feature/ux-command-palette
git push origin main

# 4. 작업 브랜치 정리
git branch -d feature/ux-command-palette
```

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
```

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
6. **기능 완료**: 전체 기능 완료 커밋 후 main 병합

### **코드 리뷰 기준**

- **브랜치별 리뷰**: 전체 기능 단위로 종합 검토
- **커밋별 리뷰**: TODO 단위의 세부 변경사항 검토
- **문서 동기화**: 계획서의 TODO 체크와 실제 구현 일치 확인

## 📊 **품질 관리**

### **커밋 전 체크리스트**

```bash
# 자동화된 체크
pnpm lint      # 코드 스타일 검증
pnpm typecheck # 타입 오류 검증
pnpm test      # 단위 테스트 실행
pnpm build     # 빌드 오류 확인
```

# 수동 체크

- [ ] TODO 항목이 완전히 완료되었는가?
- [ ] 관련 문서가 업데이트되었는가?
- [ ] 다른 기능에 영향을 주지 않는가?

### **브랜치 병합 전 체크리스트**

- [ ] 모든 TODO가 완료되었는가?
- [ ] 계획서의 성공 조건을 만족하는가?
- [ ] 코드 리뷰가 완료되었는가?
- [ ] 통합 테스트가 통과하는가?
- [ ] 문서가 최신 상태로 업데이트되었는가?

## 🚀 **자동화 가능한 개선사항**

### **Git Hooks 활용**

```bash
# pre-commit hook
#!/bin/sh
# .git/hooks/pre-commit
pnpm lint
pnpm test
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

**이 워크플로우를 통해 체계적이고 추적 가능한 개발 프로세스를 구축할 수 있습니다.**
