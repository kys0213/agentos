# Web GUI 무한 렌더링 해결 및 기능 복원 계획서

## 📋 개요

웹 환경에서 발생한 무한 렌더링 문제를 해결하기 위해 주요 컴포넌트들을 임시 단순화했습니다. 이 문서는 안정성을 유지하면서 점진적으로 기능을 복원하는 로드맵을 제시합니다.

**작성일**: 2025년 8월 3일  
**상태**: 계획 단계  
**우선순위**: 높음  

---

## 🚨 현재 상황 요약

### 해결된 문제
- ✅ 무한 렌더링 완전 해결 (`Maximum update depth exceeded`)
- ✅ WebIpcChannel → MockIpcChannel 전환으로 HTTP 404 오류 해결
- ✅ 기본 UI 인터랙션 정상 작동 확인
- ✅ E2E 테스트 안전장치 구축 완료

### 임시 단순화된 컴포넌트들
1. **LeftSidebar** - store 의존성 제거, 목 UI로 변경
2. **SidebarToggle** - 로컬 state 사용으로 변경
3. **ChatContainer** - React Query 제거, 목 채팅 메시지만 표시
4. **SettingsPanel** - store 제거, 비활성화 상태
5. **CommandPalette** - 완전 비활성화 (null 반환)
6. **AppLayout** - store 대신 로컬 state 사용

---

## 🎯 복원 목표

### 최종 목표
- 모든 Week 2 UX 기능을 완전히 복원
- 무한 렌더링 재발 방지
- 성능 최적화 및 메모리 효율성 확보
- 안정적인 상태 관리 시스템 구축

### 복원할 주요 기능들
1. **Command Palette (Cmd+K)** - kbar 기반 통합 명령어 시스템
2. **Settings Panel** - 실시간 설정 변경 및 Context Bridge
3. **Dynamic Sidebar** - 전역 상태 기반 사이드바 토글
4. **Real-time Chat** - React Query 기반 실시간 채팅 관리
5. **Context Bridge** - 화면 간 자연스러운 상태 보존

---

## 📈 4단계 점진적 복원 계획

### 🥇 1단계: Store 안정화 및 SidebarToggle 복원
**예상 기간**: 1-2일  
**위험도**: 낮음

#### 작업 내용
```typescript
// 1.1 Zustand Store getSnapshot 캐싱 최적화
const useStableUIState = () => {
  const store = useUIState();
  return useMemo(() => store, [JSON.stringify(store)]);
};

// 1.2 SidebarToggle에 안정화된 store 적용
const SidebarToggle = ({ side }) => {
  const { leftSidebarOpen } = useStableUIState();
  const { toggleLeftSidebar } = useUIActions();
  // ...
};
```

#### 성공 기준
- [ ] SidebarToggle이 전역 상태와 동기화
- [ ] 무한 렌더링 재발 없음
- [ ] 사이드바 상태가 앱 전체에서 일관성 유지

#### 테스트 계획
- 기존 E2E 테스트 통과
- 사이드바 토글 상태 동기화 테스트 추가

---

### 🥈 2단계: ContextBridge 단순화 복원
**예상 기간**: 2-3일  
**위험도**: 중간

#### 작업 내용
```typescript
// 2.1 순환 의존성 제거한 ContextBridge 설계
const useSimpleContextBridge = () => {
  const setActiveView = useUIActions(state => state.setActiveView);
  
  const goToSettings = useCallback((section) => {
    setActiveView('settings');
    // 복잡한 컨텍스트 저장 로직 제거
  }, [setActiveView]);
  
  return { goToSettings };
};

// 2.2 SettingsPanel 기본 기능 복원
const SettingsPanel = () => {
  const { activeView } = useStableUIState();
  const isOpen = activeView === 'settings';
  // 단순한 열기/닫기만 구현
};
```

#### 성공 기준
- [ ] Settings 버튼 클릭 시 실제 패널 열림
- [ ] 패널 닫기 기능 정상 작동
- [ ] Context Bridge 기본 네비게이션 복원

#### 리스크 관리
- 복잡한 상태 보존 로직은 3단계로 연기
- 최소 기능만 먼저 구현하여 안정성 확보

---

### 🥉 3단계: CommandPalette kbar 최적화 복원
**예상 기간**: 3-4일  
**위험도**: 높음

#### 작업 내용
```typescript
// 3.1 kbar Provider 최적화
const OptimizedCommandPalette = ({ children }) => {
  const actions = useMemo(() => [
    // 정적 액션만 먼저 추가
    { id: 'newChat', name: 'New Chat', perform: () => {} },
    { id: 'settings', name: 'Settings', perform: () => {} },
  ], []);
  
  return (
    <KBarProvider actions={actions}>
      {children}
      <KBarPortal>
        {/* 최소 UI만 렌더링 */}
      </KBarPortal>
    </KBarProvider>
  );
};

// 3.2 동적 액션은 점진적 추가
const useDynamicActions = () => {
  // React Query 없이 정적 데이터만 사용
  const staticSessions = useMemo(() => [...], []);
  return staticSessions;
};
```

#### 성공 기준
- [ ] Cmd+K 단축키로 팔레트 열림
- [ ] 기본 명령어들 정상 작동
- [ ] kbar로 인한 렌더링 문제 없음

#### 위험 요소
- kbar Provider가 자식 컴포넌트를 래핑하는 구조
- 동적 액션 생성 시 의존성 체인 재발 가능성

---

### 🏆 4단계: ChatContainer React Query 점진적 복원
**예상 기간**: 4-5일  
**위험도**: 높음

#### 작업 내용
```typescript
// 4.1 React Query 설정 최적화
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // 무한 재시도 방지
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5분 캐싱
      refetchInterval: false, // 자동 refetch 비활성화
    },
  },
});

// 4.2 useChatSession 훅 단순화
const useSimpleChatSession = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // React Query 대신 직접 MockIpcChannel 호출
  const { data: sessions } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => Services.getChat().getSessions(),
    enabled: false, // 수동 실행만
  });
  
  return { sessionId, messages, sessions };
};
```

#### 성공 기준
- [ ] 실시간 채팅 세션 관리 복원
- [ ] 메시지 송수신 기능 정상 작동
- [ ] React Query + Store 조합 안정성 확보

#### 위험 관리
- React Query와 Zustand 의존성 체인 모니터링
- 단계별로 기능 활성화하며 안정성 검증

---

## 🔧 기술적 개선사항

### Store 최적화 전략
```typescript
// 1. Selector 패턴으로 불필요한 리렌더링 방지
const leftSidebarOpen = useUIState(state => state.leftSidebarOpen);

// 2. useMemo로 복잡한 계산 결과 캐싱
const stableActions = useMemo(() => ({
  goToSettings: (section) => setActiveView('settings'),
  backToChat: () => setActiveView('chat'),
}), [setActiveView]);

// 3. useCallback으로 함수 안정화
const handleToggle = useCallback(() => {
  toggleLeftSidebar();
}, [toggleLeftSidebar]);
```

### React Query 최적화
```typescript
// 1. QueryKey 안정화
const chatSessionsKey = ['chat', 'sessions'] as const;

// 2. 조건부 쿼리로 불필요한 요청 방지
const { data } = useQuery({
  queryKey: chatSessionsKey,
  queryFn: getChatSessions,
  enabled: isWebEnvironment && hasValidSession,
});

// 3. 에러 경계 추가
const ChatQueryBoundary = ({ children }) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary onReset={reset}>
        {children}
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);
```

---

## 📊 모니터링 및 검증 계획

### 각 단계별 체크리스트
```bash
# 1단계 검증
- [ ] E2E 테스트 모두 통과
- [ ] 콘솔에 "Maximum update depth" 오류 없음
- [ ] 사이드바 상태 동기화 정상
- [ ] 메모리 사용량 안정적

# 2단계 검증  
- [ ] Settings 패널 열기/닫기 정상
- [ ] Context Bridge 기본 네비게이션 작동
- [ ] 다른 컴포넌트에 영향 없음

# 3단계 검증
- [ ] Cmd+K 단축키 정상 작동
- [ ] 명령어 검색 및 실행 가능
- [ ] kbar 관련 메모리 누수 없음

# 4단계 검증
- [ ] 실시간 채팅 기능 완전 복원
- [ ] React Query 에러 처리 완벽
- [ ] 전체 시스템 안정성 확보
```

### 성능 모니터링
```typescript
// 렌더링 성능 추적
const useRenderTracker = (componentName) => {
  const renderCount = useRef(0);
  renderCount.current++;
  
  console.log(`${componentName} rendered ${renderCount.current} times`);
  
  useEffect(() => {
    const perfEntry = performance.mark(`${componentName}-render`);
    return () => performance.clearMarks(`${componentName}-render`);
  });
};
```

---

## ⚠️ 위험 요소 및 대응 방안

### 1. 무한 렌더링 재발 위험
**위험도**: 높음  
**대응**: 각 단계마다 E2E 테스트 실행 + 콘솔 모니터링

### 2. 복잡한 의존성 체인 재형성
**위험도**: 중간  
**대응**: 의존성 그래프 문서화 + 단방향 데이터 플로우 강제

### 3. React Query 설정 오류
**위험도**: 중간  
**대응**: 보수적 설정 + 단계별 기능 활성화

### 4. kbar Provider 메모리 누수
**위험도**: 낮음  
**대응**: 성능 프로파일링 + 정적 액션 우선 사용

---

## 🎯 최종 목표 달성 기준

### 기능적 요구사항
- [ ] 모든 Week 2 UX 기능 100% 복원
- [ ] 무한 렌더링 완전 방지
- [ ] E2E 테스트 100% 통과
- [ ] 성능 저하 없음

### 비기능적 요구사항
- [ ] 메모리 사용량 < 100MB
- [ ] 초기 로딩 시간 < 3초
- [ ] 컴포넌트 리렌더링 < 50회/분
- [ ] 콘솔 에러 0개 유지

---

## 📅 일정 및 마일스톤

| 단계 | 기간 | 완료 예정일 | 담당자 | 상태 |
|------|------|-------------|--------|------|
| 1단계: Store 안정화 | 1-2일 | 8월 5일 | Claude | 대기 |
| 2단계: ContextBridge | 2-3일 | 8월 8일 | Claude | 대기 |  
| 3단계: CommandPalette | 3-4일 | 8월 12일 | Claude | 대기 |
| 4단계: ChatContainer | 4-5일 | 8월 17일 | Claude | 대기 |
| 최종 검증 | 1일 | 8월 18일 | Claude | 대기 |

---

## 📞 연락처 및 문서 관리

**문서 관리자**: Claude Code Assistant  
**최종 수정일**: 2025년 8월 3일  
**다음 리뷰 예정**: 각 단계 완료 시점  

**관련 문서**:
- `WEEK2_IMPLEMENTATION_PLAN.md` - Week 2 UX 기능 명세
- E2E 테스트 파일들 (`/e2e/*.test.ts`)
- 현재 상태 스크린샷들

---

*이 계획서는 안정성을 최우선으로 하여 점진적 복원을 통해 모든 기능을 안전하게 되돌리는 것을 목표로 합니다.*