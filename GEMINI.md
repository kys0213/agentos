# AgentOS 프로젝트 지침

## 🚨 필수 읽기

**모든 작업 시작 전에 반드시 [AGENTS.md](AGENTS.md) 파일을 읽고 지침을 준수해야 합니다.**

AGENTS.md에는 다음과 같은 핵심 내용이 포함되어 있습니다:

- 문제 해결 원칙 (단순함 우선 vs 분할정복)
- 복잡도 판단 기준 (COMPLEXITY_GUIDE.md 참조)
- 작업 프로세스 (계획서 작성 → 컨펌 → 실행)
- 계획서 템플릿 (PLAN_TEMPLATE.md)
- **Git 브랜치 및 커밋 전략 (절대 필수)**

## 주요 명령어

- `pnpm install` - 의존성 설치
- `pnpm build` - 전체 빌드
- `pnpm test` - 테스트 실행
- `pnpm typecheck` - 타입 체크
- `pnpm lint` - 린트 검사

## 🚨 절대 필수: Git 워크플로우 준수

**모든 코딩 작업 시 반드시 따라야 하는 Git 지침:**

### 1. 작업 시작 전 브랜치 생성 (필수)

```bash
# 작업 시작 전 반드시 브랜치 생성
git checkout -b feature/descriptive-name
# 예: feature/week2-command-palette
# 예: feature/ux-settings-panel
# 예: fix/bridge-connection-error
```

### 2. TODO별 커밋 전략 (필수)

- **각 TODO 항목 완료 시마다 즉시 커밋**
- **절대 여러 TODO를 한번에 커밋하지 말 것**
- **의미있는 커밋 메시지 필수**

```bash
# 나쁜 예: 여러 기능을 한번에
git commit -m "add features"

# 좋은 예: TODO별 구체적 커밋
git commit -m "feat: implement Command Palette keyboard shortcuts (Cmd+K)

✅ Complete todo: 키보드 단축키 등록 (Cmd+K)
- Global keyboard event listener
- kbar integration
- Prevent default behavior
"
```

### 3. 커밋 메시지 형식 (필수)

```
feat: 구체적인 기능 설명

✅ Complete todo: [해당 TODO 내용]
- 구현한 세부사항 1
- 구현한 세부사항 2
- 구현한 세부사항 3

🤖 Generated with Gemini

Co-Authored-By: Gemini <noreply@google.com>
```

### 4. 금지사항

- ❌ main 브랜치에서 직접 작업
- ❌ 여러 TODO를 한번에 커밋
- ❌ 의미없는 커밋 메시지 ("update", "fix", "add" 등)
- ❌ 작업 완료 후 한번에 모든 것을 커밋

### 5. 준수 확인

모든 작업에서 다음을 확인:

- [ ] 브랜치 생성했는가?
- [ ] TODO별로 커밋했는가?
- [ ] 커밋 메시지가 구체적인가?
- [ ] 각 커밋이 단일 책임을 갖는가?

**이 지침을 위반하면 작업을 다시 시작해야 합니다.**
