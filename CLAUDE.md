# AgentOS 프로젝트 지침

## 🚨 필수 읽기

**모든 작업 시작 전에 반드시 [AGENTS.md](AGENTS.md) 파일을 읽고 지침을 준수해야 합니다.**

AGENTS.md에는 다음과 같은 핵심 내용이 포함되어 있습니다:

- 문제 해결 원칙 (단순함 우선 vs 분할정복)
- 복잡도 판단 기준 (COMPLEXITY_GUIDE.md 참조)
- 작업 프로세스 (계획서 작성 → 컨펌 → 실행)
- 계획서 템플릿 (PLAN_TEMPLATE.md)
- **[Git Workflow Guide](docs/GIT_WORKFLOW_GUIDE.md) (절대 필수)**

## 🔍 기존 작업 확인 필수

**기존 작업을 모르겠다면 반드시 커밋 이력을 확인해야 합니다:**

```bash
# 최근 커밋 이력 확인
git log --oneline -10

# 특정 파일의 변경 이력 확인
git log -p --follow <파일경로>

# 브랜치별 작업 내용 확인
git log --oneline --graph --all -10
```

- 커밋 메시지를 통해 이전 작업의 맥락과 의도 파악
- 파일 변경 이력을 통해 기존 아키텍처와 패턴 이해
- 중복 작업 방지 및 기존 작업과의 일관성 유지

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

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
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

## 🎯 타입 설계 원칙

**TypeScript 타입 설계 시 반드시 준수해야 하는 원칙들:**

### 1. 기존 타입 재사용 우선

```typescript
// ❌ 나쁜 예: 새로운 중복 타입 정의
interface NewAgentInfo {
  id: string;
  name: string;
  preset: string;
}

// ✅ 좋은 예: 기존 타입 재사용
import { AgentMetadata } from '@agentos/core';
joinedAgents: AgentMetadata[];
```

### 2. 복잡한 중간 타입 지양

- **"Compat", "Adapter" 같은 중간 타입 최대한 지양**
- **Core 타입 직접 확장 우선**
- **변환 로직은 유틸리티 함수로 분리**

```typescript
// ❌ 나쁜 예: 복잡한 중간 타입
interface ChatSessionCompat extends LegacyType, CoreType { ... }

// ✅ 좋은 예: Core 직접 확장
interface GuiChatSession extends ChatSessionMetadata {
  isPinned?: boolean;  // GUI 전용 필드만 추가
}
```

### 3. Core 우선 설계

- **packages/core의 타입이 최고 우선순위**
- **GUI 요구사항을 Core에 반영할지 먼저 검토**
- **Core 변경이 어려운 경우에만 GUI 레벨 확장**

### 4. 단순함이 최우선

```typescript
// ❌ 복잡한 구조
interface ComplexOrchestration {
  steps: OrchestrationStep[];
  executions: AgentExecutionReference[];
  synthesis: SynthesisResult;
}

// ✅ 단순한 구조
interface SimpleMultiAgent {
  joinedAgents: AgentMetadata[];
  // 메시지에 agentMetadata 추가로 충분
}
```

## 🏗️ 인터페이스 확장 원칙

### 1. 최소 변경 원칙

- **기존 인터페이스 시그니처 변경 금지**
- **새 필드는 옵셔널(?)로 추가**
- **Breaking Change 절대 금지**

### 2. 점진적 확장

- **한 번에 모든 것을 바꾸려 하지 말 것**
- **기존 코드가 계속 동작하도록 보장**
- **새 기능은 옵셔널로 점진 도입**

### 3. 하위 호환성 보장

```typescript
// ✅ 좋은 예: 하위 호환성 유지
export interface MessageHistory extends Message {
  messageId: string;
  createdAt: Date;
  isCompressed?: boolean;
  agentMetadata?: AgentMetadata; // 새 필드는 옵셔널
}
```

## 🔧 리팩토링 원칙 (절대 필수)

### ⚠️ **리팩토링의 정의**

**리팩토링(Refactoring)**: 외부 동작은 그대로 유지하면서 내부 구조를 개선하는 작업

```
✅ 리팩토링 = 기능 유지 + 구조 개선
❌ 기능 제거/변경 ≠ 리팩토링
```

### 1. 기능 보존 원칙 (절대 준수)

```typescript
// ❌ 잘못된 "리팩토링": 기능 제거
const ChatView = () => {
  return <div>Under Development</div>; // 기존 기능 모두 제거
};

// ✅ 올바른 리팩토링: 기능 유지 + 구조 개선
const ChatView = () => {
  // 기존 기능 모두 유지
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // 구조적 개선: Mock → 실제 서비스
  const chatService = ServiceContainer.get<ChatService>('chat'); // 개선된 구조

  // 모든 기존 기능 그대로 제공
  return (
    <div>
      {/* 기존 UI 완전 복원 */}
      <MessageList messages={messages} />
      <MessageInput onSend={handleSend} />
    </div>
  );
};
```

### 2. 리팩토링 vs 다른 작업 구분

| 작업 유형        | 외부 동작 | 내부 구조 | 예시                               |
| ---------------- | --------- | --------- | ---------------------------------- |
| **✅ 리팩토링**  | 동일 유지 | 개선      | Mock 서비스 → 실제 서비스 연동     |
| **❌ 기능 제거** | 변경/제거 | -         | 컴포넌트를 "개발 중" 메시지로 교체 |
| **🔄 기능 개선** | 기능 추가 | -         | 새로운 기능 버튼 추가              |
| **🏗️ 재작성**    | 완전 변경 | 완전 변경 | 아키텍처 전면 교체                 |

### 3. 리팩토링 작업 시 체크리스트

#### **작업 전 확인사항**

- [ ] 기존 기능이 무엇인지 정확히 파악했는가?
- [ ] 사용자가 경험하는 모든 기능을 나열했는가?
- [ ] 기존 테스트가 있다면 그대로 통과해야 하는가?

#### **작업 중 원칙**

- [ ] 기존 기능을 하나도 제거하지 않았는가?
- [ ] 사용자 경험이 동일하게 유지되는가?
- [ ] 내부 구조만 개선했는가?

#### **작업 후 검증**

- [ ] 기존 모든 기능이 그대로 동작하는가?
- [ ] 새로운 버그가 발생하지 않았는가?
- [ ] 코드 품질이 실제로 개선되었는가?

### 4. 올바른 리팩토링 예시

```typescript
// 🎯 목표: ChatService Mock → Real Service 리팩토링

// ❌ 잘못된 방법: 기능 제거
const ChatView = () => <div>Chat coming soon...</div>;

// ✅ 올바른 방법: 기능 유지 + 서비스 교체
const ChatView = () => {
  // 🔄 변경: Mock → Real Service (내부 구조 개선)
  const chatService = ServiceContainer.get<ChatService>('chat');
  // const mockData = getMockChatData(); // 제거

  // ✅ 유지: 모든 기존 기능 그대로
  const [messages, setMessages] = useState([]);
  const handleSend = (msg) => chatService.sendMessage(msg); // 개선된 구현

  // ✅ 유지: 기존 UI 완전 동일
  return (
    <div className="chat-container">
      <ChatHeader />
      <MessageList messages={messages} />
      <MessageInput onSend={handleSend} />
      <QuickActions />
    </div>
  );
};
```

### 5. 금지 사항

```typescript
// ❌ 절대 금지: "리팩토링"이라는 명목으로 기능 제거
- 기존 컴포넌트를 빈 div로 교체
- 복잡한 로직을 "TODO" 주석으로 교체
- 작동하던 기능을 "개발 중" 메시지로 대체
- "나중에 구현" 이유로 기능 삭제

// ✅ 권장: 진짜 리팩토링
- Mock 데이터 → 실제 API 호출
- 하드코딩 → 설정 기반 구조
- 중복 코드 → 재사용 가능한 유틸리티
- 복잡한 컴포넌트 → 작은 컴포넌트 조합
```

### 6. 리팩토링 커밋 메시지 규칙

```bash
# ✅ 올바른 리팩토링 커밋
git commit -m "🔧 [REFACTOR] Replace mock ChatService with real service integration
- Maintain all existing chat functionality
- Improve service layer architecture
- Add proper error handling and loading states"

# ❌ 잘못된 커밋 (기능 제거)
git commit -m "refactor: simplify ChatView component"
# → 실제로는 기능을 제거했다면 리팩토링이 아님
```

## 🎨 계획 vs 실행 균형

### 1. 과도한 계획 지양

- **복잡한 아키텍처 설계보다 실용적 접근 우선**
- **실제 구현 가능성을 항상 고려**
- **"완벽한 설계"보다 "동작하는 설계"**

### 2. 실행 중 피드백 반영

- **계획이 복잡해지면 즉시 단순화 검토**
- **구현하면서 얻는 인사이트를 계획에 반영**
- **사용자 피드백에 따라 유연하게 조정**

### 3. 단계별 검증

```bash
# 각 단계마다 빌드/타입체크로 검증
pnpm build
pnpm typecheck
```

## 🔧 코드 품질 보장

### 1. 작업 완료 전 필수 체크

```bash
# 반드시 실행해야 하는 명령어들
pnpm typecheck  # 타입 에러 확인
pnpm build     # 빌드 에러 확인
pnpm lint      # 코드 스타일 확인
pnpm test      # 테스트 통과 확인
```

### 2. 타입 안전성 검증

- **any 타입 사용 절대 금지**
- **모든 public API에 명시적 타입 정의**
- **타입 가드 활용으로 런타임 안전성 보장**
