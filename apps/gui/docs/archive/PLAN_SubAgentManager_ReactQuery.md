# [ARCHIVED] SubAgentManager: React Query 전환 설계서

Archived: 2025-08-12
Reason: Implemented in code. Sub Agents now always mount the React Query–backed container (`SubAgentManagerContainer`) and no longer rely on local empty-state gating. See commits under branch `feature/subagent-e2e-fix` and `apps/gui/src/renderer/components/layout/ManagementView.tsx`.

## Requirements

### 성공 조건

- [ ] Agent 데이터를 Promise 기반 비동기 소스로부터 안전하게 로드한다.
- [ ] 프레젠테이션 컴포넌트(`SubAgentManager`)는 동기 `agents: Agent[]`만 소비한다.
- [ ] 컨테이너 컴포넌트에서 React Query로 로딩/에러/리페치/캐싱을 처리한다.
- [ ] Agent 상태 변경(Active/Idle/Inactive) 시 쿼리 무효화로 UI 일관성을 유지한다.
- [ ] 기존 UI/동작을 보존하며 타입 안전성(any 금지)을 유지한다.

### 사용 시나리오

- 사용자는 Sub Agent Manager 화면을 열면 서버(또는 비동기 소스)에서 Agent 목록이 자동으로 로드된다.
- 로딩 중에는 Skeleton/로딩 UI가, 실패 시에는 에러 및 재시도 버튼이 노출된다.
- 사용자가 상태 토글 시 성공하면 목록이 최신 값으로 갱신된다.

### 제약 조건

- 현재 디자인 컴포넌트 경로(`apps/gui/design/components`)를 유지한다.
- 기존 `SubAgentManager.tsx`는 프레젠테이션 역할만 담당한다.
- 네트워크/API 모듈은 본 작업 범위에서 구현하지 않고, `fetchAgents`/`updateAgentStatus` 콜백으로 주입받는다.

## Interface Sketch

```typescript
// types
export interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'idle' | 'inactive';
  preset: string;
  avatar?: string;
  lastUsed?: Date;
  usageCount: number;
  tags?: string[];
}

export interface SubAgentManagerProps {
  agents: Agent[];
  onUpdateAgentStatus: (agentId: string, newStatus: Agent['status']) => void;
  onOpenChat: (agentId: string, agentName: string, agentPreset: string) => void;
  onCreateAgent?: () => void;
}

// Container props: 비동기 주입 + 나머지 프레젠테이션 props
export interface SubAgentManagerContainerProps
  extends Omit<SubAgentManagerProps, 'agents' | 'onUpdateAgentStatus'> {
  fetchAgents: () => Promise<Agent[]>;
  updateAgentStatus?: (agentId: string, status: Agent['status']) => Promise<void>;
}

// React Query usage
const {
  data: agents = [],
  status,
  error,
  refetch,
} = useQuery({
  queryKey: ['agents'],
  queryFn: fetchAgents,
  staleTime: 5 * 60 * 1000,
});

// Optional mutation for status change
const mutation = useMutation({
  mutationFn: ({ id, status }) => updateAgentStatus!(id, status),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
});
```

## Todo

- [ ] `apps/gui/design/components/SubAgentManager.tsx` 타입 내보내기(export) 및 `onOpenChat` 시그니처 정정(string id)
- [ ] `apps/gui/design/components/SubAgentManagerContainer.tsx` 추가: React Query 기반 컨테이너
- [ ] 로딩/에러/재시도 UI 추가 (단순 Placeholder)
- [ ] 타입체크 및 린트 통과
- [ ] 문서(본 파일) 추가 및 레퍼런스 공유

## 작업 순서

1. 인터페이스 정리: 타입 export 및 `onOpenChat` 시그니처 수정 (완료 조건: 컴파일 오류 없음)
2. 컨테이너 구현: React Query로 데이터 로딩/에러/로딩 분기 (완료 조건: 컨테이너 렌더 성공)
3. 상태 업데이트 경로 추가(옵션): mutation + invalidate (완료 조건: 호출부에서 연결 가능)
4. 타입체크/정리: `pnpm --filter @agentos/apps-gui typecheck` 통과 (완료 조건: 오류 0)
5. 커밋: Git 가이드에 맞춰 TODO 단위로 커밋
