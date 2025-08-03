# Week 2: 핵심 UX 구현 - 상세 구현계획서

## 🎯 개요

**기간**: Week 2 (2025-08-02 ~ 2025-08-08)  
**목표**: 현대적이고 순환적인 사용자 경험 구현  
**철학**: "설정 ↔ 채팅" 간 끊김 없는 워크플로우 구축

## 📋 주요 목표

1. **Command Palette 시스템** - 모든 액션에 즉시 접근
2. **설정 시스템 개선** - 모달 → 사이드 패널 전환
3. **순환적 워크플로우** - Context Bridge 패턴으로 자연스러운 전환
4. **채팅 영역 절대 보호** - 설정 변경 시에도 채팅 컨텍스트 유지

## 🗓️ 일정별 구현 계획

### **Day 1-2: Command Palette 시스템 구축**

#### **목표**

- kbar 라이브러리 기반 Command Palette 구현
- 키보드 중심 내비게이션 지원
- 실용적 액션들로 생산성 향상

#### **요구사항**

- `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)로 즉시 접근
- 퍼지 검색으로 빠른 명령어 찾기
- 계층적 메뉴 지원 (부모-자식 액션)
- 설정 변경 시 채팅 영역 침범 절대 금지

#### **성공 조건**

- [ ] `Cmd+K` 단축키로 팔레트 즉시 열림
- [ ] "new chat", "switch bridge", "mcp settings" 등 핵심 액션 포함
- [ ] 키보드 화살표로 내비게이션 가능
- [ ] 검색어 입력 시 실시간 필터링
- [ ] ESC 키로 팔레트 닫기

#### **인터페이스 초안**

```typescript
// 1. Command Actions 타입 정의
interface CommandAction {
  id: string;
  name: string;
  shortcut?: string[];
  keywords: string;
  section?: string;
  parent?: string;
  perform: () => void | Promise<void>;
  icon?: React.ReactNode;
}

// 2. Core Actions 정의
const CORE_ACTIONS: CommandAction[] = [
  {
    id: 'new-chat',
    name: 'New Chat',
    shortcut: ['c', 'n'],
    keywords: 'create conversation start fresh',
    perform: () => startNewChat(),
    icon: <MessageSquarePlus />
  },
  {
    id: 'switch-bridge',
    name: 'Switch LLM Bridge',
    shortcut: ['b'],
    keywords: 'llm bridge change model',
    section: 'Settings'
  },
  {
    id: 'claude',
    name: 'Switch to Claude',
    parent: 'switch-bridge',
    perform: () => switchBridge('claude'),
    icon: <Bot />
  },
  {
    id: 'openai',
    name: 'Switch to OpenAI',
    parent: 'switch-bridge',
    perform: () => switchBridge('openai'),
    icon: <Cpu />
  }
];

// 3. Command Palette 컴포넌트
const CommandPalette: React.FC = () => {
  return (
    <KBarProvider actions={CORE_ACTIONS}>
      <KBarPortal>
        <KBarPositioner className="fixed inset-0 z-50 bg-black/50">
          <KBarAnimator className="mx-auto mt-[10vh] max-w-lg overflow-hidden rounded-lg bg-white shadow-xl">
            <KBarSearch
              className="w-full border-0 border-b px-4 py-3 text-lg outline-none"
              placeholder="Type a command or search..."
            />
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
    </KBarProvider>
  );
};
```

#### **구현 Todo**

1. [ ] kbar 라이브러리 설치 및 기본 설정
2. [ ] 핵심 액션 정의 (new-chat, switch-bridge, mcp-settings)
3. [ ] 키보드 단축키 등록 (Cmd+K)
4. [ ] 계층적 메뉴 구조 구현 (bridge 선택 → 개별 bridge)
5. [ ] 검색 성능 최적화 (디바운싱)
6. [ ] 접근성 개선 (ARIA 레이블, 키보드 네비게이션)

---

### **Day 3-4: 설정 시스템 개선**

#### **목표**

- 모달 → 사이드 패널 전환으로 컨텍스트 보존
- 실시간 설정 변경 및 즉시 테스트 기능
- 채팅 영역 절대 침범 금지

#### **요구사항**

- 우측에서 슬라이드되는 설정 패널
- 탭 기반 설정 카테고리 (LLM, MCP, Presets)
- 설정 변경 즉시 반영 및 테스트 가능
- 채팅 영역 레이아웃 유지

#### **성공 조건**

- [ ] 설정 패널이 우측에서 슬라이드 애니메이션으로 등장
- [ ] LLM Bridge 변경 시 즉시 적용 및 테스트 가능
- [ ] MCP 서버 추가/제거 실시간 반영
- [ ] 채팅 영역 너비 절대 변경되지 않음
- [ ] 설정 패널 열린 상태에서도 채팅 사용 가능

#### **인터페이스 초안**

```typescript
// 1. 설정 패널 상태 관리
interface SettingsState {
  isOpen: boolean;
  activeTab: 'llm' | 'mcp' | 'presets';
  tempSettings: Partial<AppSettings>; // 임시 설정 (적용 전)
}

// 2. 설정 패널 레이아웃
const SettingsPanel: React.FC = () => {
  const { isOpen, activeTab } = useSettingsStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 border-l"
        >
          <SettingsHeader />
          <SettingsTabs>
            <TabsList className="w-full grid grid-cols-3">
              <Tab value="llm">LLM Bridge</Tab>
              <Tab value="mcp">MCP Servers</Tab>
              <Tab value="presets">Presets</Tab>
            </TabsList>

            <ScrollArea className="h-[calc(100vh-120px)]">
              <TabsContent value="llm">
                <LLMBridgeSettings />
              </TabsContent>
              <TabsContent value="mcp">
                <MCPSettings />
              </TabsContent>
              <TabsContent value="presets">
                <PresetSettings />
              </TabsContent>
            </ScrollArea>
          </SettingsTabs>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 3. LLM Bridge 설정 (즉시 테스트 기능 포함)
const LLMBridgeSettings: React.FC = () => {
  const { data: bridges } = useBridges();
  const { mutate: switchBridge, isLoading } = useSwitchBridge();
  const [testMessage, setTestMessage] = useState('');

  const handleQuickTest = async () => {
    if (!testMessage.trim()) return;

    try {
      // 현재 설정된 bridge로 테스트 메시지 전송
      await sendTestMessage(testMessage);
      toast.success('Bridge test successful!');
    } catch (error) {
      toast.error(`Bridge test failed: ${error.message}`);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <Label htmlFor="bridge-select">Current Bridge</Label>
        <Select onValueChange={switchBridge} disabled={isLoading}>
          <SelectTrigger id="bridge-select">
            <SelectValue placeholder="Select LLM Bridge" />
          </SelectTrigger>
          <SelectContent>
            {bridges?.map(bridge => (
              <SelectItem key={bridge.id} value={bridge.id}>
                <div className="flex items-center gap-2">
                  <BridgeIcon type={bridge.type} />
                  {bridge.name}
                  {bridge.status === 'active' && (
                    <Badge variant="success" size="sm">Active</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 즉시 테스트 영역 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Enter test message..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickTest()}
          />
          <Button
            size="sm"
            onClick={handleQuickTest}
            disabled={!testMessage.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test Bridge'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
```

#### **구현 Todo**

1. [ ] Framer Motion 기반 사이드 패널 애니메이션
2. [ ] Radix UI Tabs로 설정 카테고리 분리
3. [ ] LLM Bridge 설정 UI 개선 (즉시 테스트 포함)
4. [ ] MCP 서버 관리 UI (추가/제거/상태 확인)
5. [ ] 설정 변경 시 실시간 반영 로직
6. [ ] 채팅 영역 레이아웃 보호 확인

---

### **Day 5: 순환적 워크플로우 구현**

#### **목표**

- Context Bridge 패턴으로 자연스러운 화면 전환
- 채팅 → 설정 → 채팅 순환 시 컨텍스트 보존
- 오류 상황에서 자동 설정 제안

#### **요구사항**

- 채팅에서 설정으로 이동 시 현재 대화 유지
- 설정 완료 후 원래 채팅으로 복귀
- MCP/Bridge 오류 시 자동 설정 링크 제공
- 모든 전환에서 데이터 손실 없음

#### **성공 조건**

- [ ] 채팅 중 설정 변경 후 원래 대화로 복귀
- [ ] 오류 메시지에 해당 설정으로 가는 버튼 자동 생성
- [ ] 설정 변경 후 채팅에서 즉시 반영 확인 가능
- [ ] "Back to Chat" 버튼으로 언제든 복귀 가능
- [ ] 브라우저 뒤로가기 버튼으로도 자연스러운 내비게이션

#### **인터페이스 초안**

```typescript
// 1. Context Bridge Hook
interface NavigationContext {
  fromView: 'chat' | 'settings' | 'history';
  chatSessionId?: string;
  settingsSection?: string;
  returnData?: Record<string, any>;
}

const useContextBridge = () => {
  const navigate = useAppStore(state => state.setActiveView);
  const [context, setContext] = useState<NavigationContext | null>(null);

  const goToSettings = (section?: string, fromContext?: Partial<NavigationContext>) => {
    // 현재 컨텍스트 저장
    setContext({
      fromView: 'chat',
      chatSessionId: useAppStore.getState().chat.activeSessionId,
      settingsSection: section,
      ...fromContext
    });

    navigate('settings');

    // 특정 섹션으로 바로 이동
    if (section) {
      useAppStore.setState(state => ({
        settings: { ...state.settings, activeTab: section }
      }));
    }
  };

  const backToChat = (returnData?: Record<string, any>) => {
    if (context?.chatSessionId) {
      // 이전 채팅 세션 복원
      useAppStore.setState(state => ({
        chat: { ...state.chat, activeSessionId: context.chatSessionId }
      }));
    }

    navigate('chat');

    // 설정 변경 결과가 있다면 채팅에서 확인 메시지 표시
    if (returnData) {
      showSettingsAppliedToast(returnData);
    }

    setContext(null);
  };

  const goToHistory = () => {
    setContext({
      fromView: 'chat',
      chatSessionId: useAppStore.getState().chat.activeSessionId
    });
    navigate('history');
  };

  return { goToSettings, backToChat, goToHistory, context };
};

// 2. 스마트 에러 메시지 컴포넌트
const SmartErrorMessage: React.FC<{ message: Message }> = ({ message }) => {
  const { goToSettings } = useContextBridge();

  const getErrorActions = (errorContent: string) => {
    const actions: Array<{ label: string; action: () => void; variant?: 'default' | 'destructive' }> = [];

    if (errorContent.includes('MCP')) {
      actions.push({
        label: 'Fix MCP Settings',
        action: () => goToSettings('mcp'),
        variant: 'default'
      });
    }

    if (errorContent.includes('Bridge') || errorContent.includes('LLM')) {
      actions.push({
        label: 'Check Bridge Settings',
        action: () => goToSettings('llm'),
        variant: 'default'
      });
    }

    if (errorContent.includes('API key') || errorContent.includes('authentication')) {
      actions.push({
        label: 'Update API Keys',
        action: () => goToSettings('llm'),
        variant: 'destructive'
      });
    }

    return actions;
  };

  const errorActions = getErrorActions(message.content);

  return (
    <div className="message error border-l-4 border-red-500 bg-red-50 p-4 rounded">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-red-800">{message.content}</p>
          {errorActions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {errorActions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant || 'default'}
                  onClick={action.action}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. 설정 완료 알림 시스템
const showSettingsAppliedToast = (data: Record<string, any>) => {
  if (data.bridgeChanged) {
    toast.success(`Switched to ${data.bridgeName}. Ready to chat!`, {
      action: {
        label: 'Test Now',
        onClick: () => {
          // 채팅 입력창에 테스트 메시지 자동 입력
          const chatInput = document.querySelector('[data-testid="chat-input"]') as HTMLInputElement;
          if (chatInput) {
            chatInput.value = 'Hello! Testing new bridge...';
            chatInput.focus();
          }
        }
      }
    });
  }

  if (data.mcpAdded) {
    toast.success(`MCP server "${data.mcpName}" connected successfully!`);
  }
};
```

#### **구현 Todo**

1. [ ] Context Bridge Hook 구현 (goToSettings, backToChat)
2. [ ] 스마트 에러 메시지 컴포넌트 (자동 설정 링크)
3. [ ] 설정 패널에 "Back to Chat" 버튼 추가
4. [ ] 설정 변경 후 채팅 복귀 시 알림 시스템
5. [ ] 브라우저 히스토리 통합 (뒤로가기 지원)
6. [ ] 컨텍스트 보존 테스트 (채팅 → 설정 → 채팅)

---

## 🧪 테스트 계획

### **단위 테스트**

```typescript
// Command Palette 테스트
describe('CommandPalette', () => {
  test('Cmd+K로 팔레트 열기', async () => {
    render(<App />);
    await user.keyboard('{Meta>}k{/Meta}');
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('new chat 액션 실행', async () => {
    render(<CommandPalette />);
    await user.type(screen.getByRole('combobox'), 'new chat');
    await user.click(screen.getByText('New Chat'));
    expect(mockStartNewChat).toHaveBeenCalled();
  });
});

// Context Bridge 테스트
describe('useContextBridge', () => {
  test('채팅에서 설정으로 이동 시 컨텍스트 보존', () => {
    const { result } = renderHook(() => useContextBridge());
    act(() => {
      result.current.goToSettings('mcp');
    });
    expect(result.current.context?.fromView).toBe('chat');
    expect(result.current.context?.settingsSection).toBe('mcp');
  });
});
```

### **E2E 테스트**

```typescript
test('순환적 워크플로우: 채팅 → 설정 → 채팅', async ({ page }) => {
  // 1. 채팅 시작
  await page.goto('/');
  await page.fill('[data-testid="chat-input"]', 'Hello');
  await page.click('[data-testid="send-button"]');

  // 2. Command Palette로 설정 열기
  await page.keyboard.press('Meta+K');
  await page.fill('[data-testid="command-search"]', 'mcp');
  await page.click('text=MCP Settings');

  // 3. 설정 변경
  await page.selectOption('[data-testid="mcp-select"]', 'new-server');

  // 4. 채팅으로 복귀
  await page.click('[data-testid="back-to-chat"]');

  // 검증: 원래 채팅 세션이 유지되는지 확인
  await expect(page.locator('[data-testid="chat-messages"]')).toContainText('Hello');
});
```

## 📊 성공 지표

### **정량적 지표**

- Command Palette 접근 시간: < 0.5초
- 설정 → 채팅 복귀 시간: < 1초
- 키보드 내비게이션 성공률: 100%
- 컨텍스트 보존 성공률: 100%

### **정성적 지표**

- 설정 변경이 "자연스럽고" "끊김없이" 느껴짐
- 채팅 중단 없이 설정 조정 가능
- 오류 상황에서 해결 방법이 명확함

## 🚀 Week 3 준비사항

Week 2 완료 후 다음 주제들이 자연스럽게 연결됩니다:

1. **예측적 UI** - 사용자 패턴 분석하여 다음 액션 제안
2. **Task-Oriented Interface** - 빈 채팅 상태에서 목적별 시작점 제공
3. **Progressive Disclosure** - 초보자/전문가 모드 분리

## 📝 참고 자료

- [Command Palette 디자인 패턴](https://ui.shadcn.com/docs/components/command)
- [Framer Motion 레이아웃 애니메이션](https://www.framer.com/motion/layout-animations/)
- [Radix UI 접근성 가이드](https://www.radix-ui.com/docs/primitives/overview/accessibility)
- [kbar 라이브러리 문서](https://kbar.vercel.app/)

---

**작성자**: Claude Code  
**작성일**: 2025-08-02  
**버전**: 1.0
