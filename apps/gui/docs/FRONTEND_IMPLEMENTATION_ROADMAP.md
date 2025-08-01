# AgentOS GUI 현대적 프론트엔드 실행 계획

## 🎯 Week 1 완료 상태 (2025-08-01)

### ✅ **완료된 작업들**

#### **Day 1-2: 상태 관리 현대화** ✅ COMPLETED

- [x] Zustand + React Query + TypeScript 통합 설치
- [x] 14개 useState → 3개 객체로 통합 (ui, chat, settings)
- [x] React Query로 서버 상태 완전 분리
- [x] 선택적 구독으로 성능 최적화
- [x] DevTools 통합으로 디버깅 지원

#### **Day 3-4: 컴포넌트 아키텍처 분리** ✅ COMPLETED

- [x] ChatApp.tsx 230줄 → 15줄로 대폭 간소화 (93% 감소)
- [x] 레이아웃 컴포넌트: AppLayout, LeftSidebar, RightSidebar, ChatArea
- [x] 채팅 컴포넌트: ChatContainer 분리
- [x] 설정 컴포넌트: SettingsContainer, LLMSettings, PresetSettings
- [x] 역할별 명확한 분리 및 단일 책임 원칙 적용

#### **Day 5: CSS Grid 레이아웃 시스템** ✅ COMPLETED

- [x] Tailwind CSS v4 통합 설치 및 설정
- [x] CSS Grid 기반 고정 레이아웃 (layout-grid-\*)
- [x] 채팅 영역 절대 보호 시스템
- [x] 반응형 사이드바 토글 (◁ ▷ 버튼)
- [x] Chakra + Tailwind 하이브리드 구조

### ⏳ **미완성 작업들**

#### **Week 2: 핵심 UX 구현** (예정)

- [ ] Command Palette 시스템 (kbar 활용)
- [ ] 설정 시스템 개선 (모달 → 사이드 패널)
- [ ] 순환적 워크플로우 구현
- [ ] Context Bridge 패턴

#### **Week 3: 스마트 UX 기능** (예정)

- [ ] 예측적 UI 구현
- [ ] Task-Oriented Interface
- [ ] Progressive Disclosure
- [ ] FloatingActionButton 시스템

#### **Week 4: 성능 최적화 & 완성도** (예정)

- [ ] Virtual Scrolling (react-window)
- [ ] 번들 분할 및 Code Splitting
- [ ] 접근성 개선 (ARIA, 키보드 네비게이션)
- [ ] 반응형 레이아웃 완성

### 📊 **정량적 성과**

- **ChatApp.tsx**: 230줄 → 15줄 (93% 감소)
- **useState**: 14개 → 3개 객체 (78% 감소)
- **컴포넌트**: 1개 → 12개 역할별 분리
- **빌드 성공**: ✅ TypeScript 에러 0개
- **성능**: React Query 캐싱으로 최적화

---

## 🎯 기술 스택 선정

### 핵심 기술 스택

- **React 18** - Concurrent Features, Suspense, Automatic Batching
- **TypeScript 5.3** - Strict 모드, 고급 타입 활용
- **Zustand** - 간단하고 성능 좋은 상태 관리
- **TanStack Query** - 서버 상태 관리 및 캐싱
- **Framer Motion** - 선언적 애니메이션
- **Radix UI Primitives** - 접근성 보장된 헤드리스 컴포넌트
- **Tailwind CSS** - 유틸리티 기반 스타일링 (Chakra와 점진적 전환)

### 개발 도구

- **Vite** - 빠른 개발 서버 및 번들링
- **Vitest** - 단위 테스트
- **Playwright** - E2E 테스트
- **Storybook** - 컴포넌트 문서화

## 📋 4주 실행 계획

### **Week 1: 아키텍처 재구성** 🏗️

#### Day 1-2: 상태 관리 현대화

```typescript
// 1. Zustand 스토어 구조 설계
interface AppState {
  ui: {
    leftSidebarOpen: boolean;
    rightSidebarOpen: boolean;
    activeView: 'chat' | 'settings' | 'history';
    commandPaletteOpen: boolean;
  };
  chat: {
    activeSessionId: string | null;
    sessions: ChatSession[];
    messages: Message[];
    loading: boolean;
  };
  settings: {
    currentBridge: BridgeConfig | null;
    mcpConfigs: McpConfig[];
    presets: Preset[];
  };
}

// 2. 스토어 구현
const useAppStore = create<AppState & AppActions>((set, get) => ({
  // State
  ui: {
    leftSidebarOpen: true,
    rightSidebarOpen: true,
    activeView: 'chat',
    commandPaletteOpen: false,
  },

  // Actions
  toggleLeftSidebar: () =>
    set((state) => ({
      ui: { ...state.ui, leftSidebarOpen: !state.ui.leftSidebarOpen },
    })),

  setActiveView: (view) =>
    set((state) => ({
      ui: { ...state.ui, activeView: view },
    })),
}));

// 3. 서버 상태 분리 (React Query)
const useChatSessions = () =>
  useQuery({
    queryKey: ['chatSessions'],
    queryFn: () => chatService.listSessions(),
    staleTime: 30000,
  });
```

#### Day 3-4: 컴포넌트 아키텍처 분리

```typescript
// 기존 ChatApp.tsx (230줄) 분해
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx           // 메인 레이아웃
│   │   ├── LeftSidebar.tsx         // 네비게이션 + 액션
│   │   ├── RightSidebar.tsx        // 히스토리 + 컨텍스트
│   │   └── ChatArea.tsx            // 고정 채팅 영역
│   ├── chat/
│   │   ├── ChatContainer.tsx       // 채팅 로직 컨테이너
│   │   ├── MessageList.tsx         // 메시지 리스트
│   │   └── ChatInput.tsx           // 입력 컴포넌트
│   ├── settings/
│   │   ├── SettingsPanel.tsx       // 통합 설정 패널
│   │   ├── LLMSettings.tsx         // LLM 브릿지 설정
│   │   └── MCPSettings.tsx         // MCP 설정
│   └── ui/
│       ├── CommandPalette.tsx      // 명령 팔레트
│       └── FloatingActionButton.tsx // FAB 시스템
```

#### Day 5: 레이아웃 시스템 구현

```tsx
// AppLayout.tsx - CSS Grid 기반
const AppLayout: React.FC = () => {
  const { leftSidebarOpen, rightSidebarOpen } = useAppStore();

  return (
    <div
      className={cn(
        'h-screen grid transition-all duration-300',
        leftSidebarOpen && rightSidebarOpen
          ? 'grid-cols-[300px_1fr_300px]'
          : leftSidebarOpen
            ? 'grid-cols-[300px_1fr_0px]'
            : rightSidebarOpen
              ? 'grid-cols-[0px_1fr_300px]'
              : 'grid-cols-[0px_1fr_0px]'
      )}
    >
      <LeftSidebar />
      <ChatArea /> {/* 절대 침범되지 않는 고정 영역 */}
      <RightSidebar />
    </div>
  );
};
```

### **Week 2: 핵심 UX 구현** ⚡

#### Day 1-2: Command Palette 시스템

```typescript
// 실용적 Command Palette 구현 (kbar 라이브러리 활용)
const CommandPalette: React.FC = () => {
  const actions = useMemo(() => [
    {
      id: 'new-chat',
      name: 'New Chat',
      shortcut: ['c', 'n'],
      keywords: 'create conversation',
      perform: () => startNewChat(),
    },
    {
      id: 'switch-bridge',
      name: 'Switch LLM Bridge',
      shortcut: ['b'],
      keywords: 'llm bridge change',
      section: 'Settings',
    },
    {
      id: 'claude',
      name: 'Switch to Claude',
      parent: 'switch-bridge',
      perform: () => switchBridge('claude'),
    },
    {
      id: 'mcp-settings',
      name: 'MCP Settings',
      shortcut: ['m'],
      keywords: 'mcp server configure',
      perform: () => openMCPSettings(),
    }
  ], []);

  return (
    <KBarProvider actions={actions}>
      <KBarPortal>
        <KBarPositioner className="z-50">
          <KBarAnimator className="bg-white rounded-lg shadow-xl">
            <KBarSearch className="p-4 border-b" />
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
    </KBarProvider>
  );
};
```

#### Day 3-4: 설정 시스템 개선

```typescript
// 모달 → 사이드 패널 전환 (Radix UI Dialog)
const SettingsPanel: React.FC = () => {
  const { activeView, setActiveView } = useAppStore();

  return (
    <AnimatePresence>
      {activeView === 'settings' && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg z-40"
        >
          <SettingsTabs>
            <TabsList>
              <Tab value="llm">LLM Bridge</Tab>
              <Tab value="mcp">MCP Servers</Tab>
              <Tab value="presets">Presets</Tab>
            </TabsList>

            <TabsContent value="llm">
              <LLMBridgeSettings />
            </TabsContent>

            <TabsContent value="mcp">
              <MCPSettings />
            </TabsContent>
          </SettingsTabs>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 실시간 설정 변경 (채팅 영역 침범 없이)
const LLMBridgeSettings: React.FC = () => {
  const { data: bridges } = useBridges();
  const { mutate: switchBridge } = useSwitchBridge();

  return (
    <div className="p-4">
      <Label>Current Bridge</Label>
      <Select onValueChange={switchBridge}>
        {bridges.map(bridge => (
          <SelectItem key={bridge.id} value={bridge.id}>
            {bridge.name}
          </SelectItem>
        ))}
      </Select>

      {/* 실시간 테스트 영역 */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <Label>Test Message</Label>
        <Input placeholder="Type to test current bridge..." />
        <Button size="sm" className="mt-2">
          Quick Test
        </Button>
      </div>
    </div>
  );
};
```

#### Day 5: 순환적 워크플로우 구현

```typescript
// Context Bridge 패턴 - 실용적 구현
const useContextBridge = () => {
  const navigate = useAppStore(state => state.setActiveView);

  const goToSettings = (section?: string) => {
    navigate('settings');
    // 설정 섹션으로 바로 이동하면서 현재 채팅 컨텍스트 보존
    if (section) {
      useAppStore.setState(state => ({
        settings: { ...state.settings, activeSection: section }
      }));
    }
  };

  const backToChat = () => {
    navigate('chat');
    // 이전 채팅 상태 복원
  };

  return { goToSettings, backToChat };
};

// 채팅에서 설정으로 자연스러운 전환
const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const { goToSettings } = useContextBridge();

  if (message.type === 'error' && message.error?.includes('MCP')) {
    return (
      <div className="message error">
        <p>{message.content}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => goToSettings('mcp')}
        >
          Fix MCP Settings
        </Button>
      </div>
    );
  }

  return <div className="message">{message.content}</div>;
};
```

### **Week 3: 스마트 UX 기능** 🤖

#### Day 1-2: 예측적 UI 구현

```typescript
// AI 예측보다는 실용적 패턴 기반 예측
const usePredictiveUI = () => {
  const { messages, currentBridge } = useAppStore();

  const suggestions = useMemo(() => {
    const suggestions: UISuggestion[] = [];

    // 패턴 1: MCP 에러가 자주 발생하면 설정 제안
    const mcpErrors = messages.filter(m =>
      m.type === 'error' && m.content.includes('MCP')
    ).length;

    if (mcpErrors > 2) {
      suggestions.push({
        type: 'settings',
        title: 'MCP Settings needs attention',
        action: () => openMCPSettings(),
        priority: 'high'
      });
    }

    // 패턴 2: 같은 종류 질문 반복 시 Preset 제안
    const recentQuestions = messages.slice(-5).filter(m => m.role === 'user');
    if (recentQuestions.length > 0) {
      // 질문 패턴 분석 로직
    }

    return suggestions;
  }, [messages]);

  return suggestions;
};

// FloatingActionButton에 예측 기능 통합
const FloatingActionButton: React.FC = () => {
  const suggestions = usePredictiveUI();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {suggestions.map(suggestion => (
          <motion.div
            key={suggestion.type}
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 20 }}
            className="mb-2"
          >
            <Button
              size="sm"
              variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}
              onClick={suggestion.action}
            >
              {suggestion.title}
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button
        className="rounded-full w-14 h-14 shadow-lg"
        onClick={() => setExpanded(!expanded)}
      >
        <Plus className={cn("transition-transform", expanded && "rotate-45")} />
      </Button>
    </div>
  );
};
```

#### Day 3-4: Task-Oriented Interface

```typescript
// 빈 채팅 상태 - 목적 기반 시작점
const EmptyChatState: React.FC = () => {
  const startTaskBasedChat = async (taskType: TaskType) => {
    const preset = getPresetForTask(taskType);
    const mcp = getMCPForTask(taskType);

    // 자동 구성
    await Promise.all([
      preset && applyPreset(preset),
      mcp && enableMCP(mcp)
    ]);

    // 컨텍스트에 맞는 시작 메시지
    const starterPrompt = getStarterPrompt(taskType);
    startNewChat(starterPrompt);
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-semibold mb-6">
          What would you like to do?
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <TaskCard
            icon={<Code2 />}
            title="Debug Code"
            description="Find and fix issues in your code"
            onClick={() => startTaskBasedChat('debug')}
          />

          <TaskCard
            icon={<GitPullRequest />}
            title="Code Review"
            description="Review code changes and improvements"
            onClick={() => startTaskBasedChat('review')}
          />

          <TaskCard
            icon={<BookOpen />}
            title="Learn Concept"
            description="Understand new technologies or concepts"
            onClick={() => startTaskBasedChat('learn')}
          />

          <TaskCard
            icon={<Wrench />}
            title="Build Feature"
            description="Plan and implement new features"
            onClick={() => startTaskBasedChat('build')}
          />
        </div>
      </div>
    </div>
  );
};
```

#### Day 5: Progressive Disclosure

```typescript
// 단계별 복잡도 노출
const SettingsView: React.FC = () => {
  const [expertMode, setExpertMode] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2>Settings</h2>
        <Switch
          checked={expertMode}
          onCheckedChange={setExpertMode}
        >
          Expert Mode
        </Switch>
      </div>

      {/* Level 1: 기본 설정 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Quick Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <LLMBridgeSelector />
          <PresetSelector />
        </CardContent>
      </Card>

      {/* Level 2: 고급 설정 (Expert Mode) */}
      <AnimatePresence>
        {expertMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Advanced Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <MCPServerManager />
                <BridgeCustomization />
                <PerformanceTuning />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

### **Week 4: 성능 최적화 & 완성도** 🚀

#### Day 1-2: 성능 최적화

```typescript
// 1. 컴포넌트 최적화
const ChatMessageList = React.memo(({ messages }: { messages: Message[] }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={messages.length}
      itemSize={80}
      itemData={messages}
    >
      {MessageItem}
    </FixedSizeList>
  );
});

// 2. 번들 분할
const SettingsPanel = lazy(() => import('./SettingsPanel'));
const CommandPalette = lazy(() => import('./CommandPalette'));

// 3. 상태 최적화
const useOptimizedChatStore = create<ChatState>()(
  subscribeWithSelector(
    devtools((set, get) => ({
      // 선택적 구독으로 불필요한 리렌더링 방지
      messages: [],
      addMessage: (message) => set(
        (state) => ({ messages: [...state.messages, message] }),
        false, // 구독자에게 즉시 알리지 않음
        'addMessage'
      ),
    }))
  )
);
```

#### Day 3-4: 접근성 & 반응형

```typescript
// 접근성 개선
const CommandPalette: React.FC = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button aria-label="Open command palette (Ctrl+K)">
          ⌘K
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          role="combobox"
          aria-expanded="true"
          aria-label="Command palette"
        >
          <VisuallyHidden>
            <Dialog.Title>Command Palette</Dialog.Title>
            <Dialog.Description>
              Search and execute commands quickly
            </Dialog.Description>
          </VisuallyHidden>

          <CommandSearch />
          <CommandList />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// 반응형 레이아웃
const AppLayout: React.FC = () => {
  return (
    <div className={cn(
      "h-screen grid transition-all duration-300",
      // Desktop: 3-panel
      "lg:grid-cols-[300px_1fr_300px]",
      // Tablet: 2-panel
      "md:grid-cols-[250px_1fr_0px]",
      // Mobile: 1-panel + overlay
      "grid-cols-[0px_1fr_0px]"
    )}>
      <LeftSidebar />
      <ChatArea />
      <RightSidebar />

      {/* Mobile Navigation */}
      <MobileBottomNav className="lg:hidden" />
    </div>
  );
};
```

#### Day 5: 테스트 & 배포 준비

```typescript
// E2E 테스트 시나리오
test('순환적 워크플로우: 채팅 → 설정 → 테스트 → 채팅', async ({ page }) => {
  // 1. 채팅 시작
  await page.goto('/');
  await page.fill('[data-testid="chat-input"]', 'Hello');
  await page.click('[data-testid="send-button"]');

  // 2. 설정으로 이동 (컨텍스트 보존)
  await page.keyboard.press('Meta+K'); // Command Palette
  await page.fill('[data-testid="command-search"]', 'settings');
  await page.click('[data-testid="mcp-settings"]');

  // 3. 설정 변경
  await page.selectOption('[data-testid="mcp-select"]', 'new-server');

  // 4. 즉시 테스트 (채팅 영역 침범 없이)
  await page.click('[data-testid="quick-test"]');

  // 5. 채팅으로 복귀
  await page.click('[data-testid="back-to-chat"]');

  // 검증: 설정이 적용되었는지 확인
  await expect(page.locator('[data-testid="active-mcp"]')).toContainText('new-server');
});

// 성능 테스트
test('대량 메시지 처리 성능', async ({ page }) => {
  // 1000개 메시지 로드 시 60fps 유지되는지 확인
  await page.evaluate(() => {
    // 1000개 메시지 추가
    for (let i = 0; i < 1000; i++) {
      window.addTestMessage(`Message ${i}`);
    }
  });

  // 스크롤 성능 확인
  const scrollMetrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      const chatArea = document.querySelector('[data-testid="chat-area"]');
      let frames = 0;
      const start = performance.now();

      const scroll = () => {
        chatArea.scrollTop += 10;
        frames++;

        if (frames < 60) {
          requestAnimationFrame(scroll);
        } else {
          const end = performance.now();
          resolve((60 / (end - start)) * 1000); // FPS 계산
        }
      };

      requestAnimationFrame(scroll);
    });
  });

  expect(scrollMetrics).toBeGreaterThan(55); // 55fps 이상 유지
});
```

## 📊 성공 지표 & 검증

### 기술적 지표

- **번들 크기**: 초기 로드 < 500KB
- **TTI (Time to Interactive)**: < 2초
- **FCP (First Contentful Paint)**: < 1초
- **메모리 사용량**: 1000개 메시지 기준 < 100MB

### UX 지표

- **설정 접근 시간**: 3클릭 → 1클릭 (Cmd+K)
- **채팅 영역 침범**: 0% (절대 보장)
- **컨텍스트 전환 성공률**: > 95%
- **사용자 만족도**: A/B 테스트 기준 > 85%

## 🔧 도구 & 환경 설정

### 개발 환경

```json
// package.json 추가 의존성
{
  "dependencies": {
    "zustand": "^4.4.1",
    "@tanstack/react-query": "^4.29.0",
    "framer-motion": "^10.16.0",
    "@radix-ui/react-dialog": "^1.0.4",
    "@radix-ui/react-select": "^1.2.2",
    "kbar": "^0.1.0-beta.45",
    "react-window": "^1.8.8"
  },
  "devDependencies": {
    "vitest": "^0.34.0",
    "@playwright/test": "^1.37.0",
    "@storybook/react-vite": "^7.4.0"
  }
}
```

### 빌드 최적화

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', 'framer-motion'],
          settings: ['./src/components/settings/index.ts'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['zustand', '@tanstack/react-query'],
  },
});
```

---

## 🎯 핵심 철학

**"점진적 개선, 즉시 가치 제공"**

각 주차별로 사용자가 체감할 수 있는 개선사항을 제공하며, 기술 부채를 해결하면서도 새로운 기능을 안정적으로 추가하는 것이 목표입니다.

현대적 프론트엔드 기법을 활용하되, 과도한 엔지니어링 없이 실용적이고 유지보수 가능한 코드베이스를 구축합니다.
