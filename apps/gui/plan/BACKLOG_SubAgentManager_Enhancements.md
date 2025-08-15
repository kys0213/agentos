# SubAgentManager 후속 개선 백로그

본 문서는 SubAgentManager 관련 후속 개선 과제를 백로그 형태로 정리합니다. 구현은 별도 브랜치에서 진행합니다.

## Requirements

### 성공 조건

- [ ] 기능 플래그로 기존/신규 SubAgentManager를 안전하게 토글할 수 있다.
- [ ] 로딩/에러 UI가 디자인 시스템에 맞게 일관적으로 표시된다.
- [ ] 상태 변경(Active/Idle/Inactive)이 낙관적 업데이트로 즉시 반영되고, 서버 상태와 동기화된다.
- [ ] 코어 상태(`error`)가 UI에 명확히 구분되어 표기된다(뱃지/툴팁 등).

### 사용 시나리오

- [ ] 운영 환경에서 문제 발생 시 플래그 OFF로 즉시 롤백 가능.
- [ ] 사용자는 상태 토글 시 즉시 UI 반영을 보고, 실패 시 자동 롤백 안내를 받는다.
- [ ] 데이터 로딩 실패 시 재시도 버튼과 간결한 원인 안내가 제공된다.

### 제약 조건

- [ ] any 사용 금지, 타입 엄격 모드 유지.
- [ ] React Query 패턴 준수(쿼리 무효화, 키 일관성).
- [ ] 기존 라우팅/서비스 구조 변경 최소화.

## Interface Sketch

```typescript
// 기능 플래그 (Zustand)
export interface FeatureFlags {
  subAgent: { useDesignContainer: boolean };
}

// 상태 뱃지 확장
type UiAgentStatus = 'active' | 'idle' | 'inactive' | 'error';

// 낙관적 업데이트 뮤테이션
const mutation = useMutation({
  mutationFn: updateAgentStatus,
  onMutate: async ({ id, status }) => {
    await queryClient.cancelQueries({ queryKey: ['agents'] });
    const prev = queryClient.getQueryData<Agent[]>(['agents']);
    queryClient.setQueryData<Agent[]>(['agents'], (old = []) =>
      old.map((a) => (a.id === id ? { ...a, status } : a))
    );
    return { prev };
  },
  onError: (_e, _v, ctx) => {
    if (ctx?.prev) queryClient.setQueryData(['agents'], ctx.prev);
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
});
```

## Todo

- [ ] 기능 플래그 스토어 추가(`feature-flags-store.ts`) 및 기본값(개발 ON/운영 OFF)
- [ ] ManagementView에 토글 분기 적용(기존/신규 컴포넌트)
- [ ] 로딩/에러 UI 개선(스켈레톤, 재시도 버튼, 접근성 레이블)
- [ ] `'error'` 상태 뱃지/툴팁 추가 및 필터/집계 반영
- [ ] 상태 변경 낙관적 업데이트 + 실패 롤백 처리
- [ ] 타입 정리 및 문서 업데이트

## 작업 순서

1. 기능 플래그 인프라 도입 및 분기 적용 (완료 조건: 런타임 토글 동작 확인)
2. 로딩/에러 UI 개선 (완료 조건: 로딩/에러 시 표준 UI 노출)
3. `'error'` 상태 노출 및 필터 반영 (완료 조건: 리스트/통계에 반영)
4. 낙관적 업데이트 적용 (완료 조건: 즉시 반영·실패 롤백·최종 동기화 확인)
5. 타입/문서 정리 (완료 조건: typecheck 통과, 문서 최신화)

## 메모

- 코어의 `AgentStatus`가 `'error'`를 포함하므로 UI 계층에 4상태를 도입하거나, 현행 3상태를 유지한다면 명확한 매핑 전략을 명시해야 합니다.
- 기능 플래그는 향후 IPC/원격 설정으로 확장 가능하며, 초기에는 로컬 스토어 기반으로 단순 운영합니다.
