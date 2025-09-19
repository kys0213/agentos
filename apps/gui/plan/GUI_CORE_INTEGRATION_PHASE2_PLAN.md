# GUI Core Integration Phase 2 Plan

Status: In Progress
Last Updated: 2025-09-19

## Requirements

### 성공 조건

- [x] SubAgentManager에서 카테고리 필터가 keyword 매핑과 일치하도록 동작하고 단위 테스트로 보강한다. (`SubAgentManager.filter.test.tsx`)
- [x] Bridge 등록 다이얼로그가 유효/무효 입력과 성공 후 캐시 무효화를 검증하는 테스트를 갖춘다. (`ModelManager.register.test.tsx`)
- [ ] Dashboard 카드가 실데이터 기반으로 로딩/에러/Retry UX를 제공하고 컴포넌트 테스트가 통과한다.
- [ ] KnowledgeBaseManager의 업로드/삭제/검색을 Core RPC 경로로 전환하기 위한 마이그레이션 전략을 수립하고 프로토타입을 완성한다.
- [ ] MCP 도구 관리에서 usage 이벤트 스트림을 활용한 실시간 갱신 경로와 관련 테스트를 마련한다.

### 사용 시나리오

- [x] 사용자가 SubAgent 목록 화면에서 카테고리를 선택하면 해당 키워드 매핑에 따라 목록이 필터링된다. (UI & 단위 테스트)
- [x] 사용자가 Bridge 등록 다이얼로그에 올바른 Manifest JSON을 입력하면 등록 후 목록이 갱신되고, 잘못된 입력 시 명확한 오류가 표시된다. (등록 다이얼로그 테스트)
- [ ] Dashboard가 로딩/에러/성공 상태를 구분해 보여주고, Retry 시 지표가 재요청된다.
- [ ] Knowledge 문서 추가/삭제/검색이 Core API를 통해 수행되고, 기존 localStorage 데이터는 마이그레이션 유틸로 옮겨진다.
- [ ] MCP Tool Manager가 usage 이벤트 스트림을 반영해 사용량 패널을 실시간으로 갱신한다.

### 제약 조건

- [ ] 기존 브랜치 전략(`feature/gui-core-integration-epic` 기준 하위 브랜치)과 Git Workflow를 준수한다.
- [ ] 코드를 변경할 때 Core 계약(Zod 스키마)을 참조하며 any/unsafe 타입을 도입하지 않는다.
- [ ] 테스트는 Vitest renderer 프로젝트 기준으로 실행되며, 브라우저 의존 동작은 Testing Library를 활용한다.
- [ ] Knowledge/Core 변경이 필요한 경우 별도 PR로 분리하고, GUI 레이어에서는 함수 플래그/파사드로 대응한다.

## Interface Sketch

```ts
// SubAgentManager 필터 테스트 예시 스케치
it('filters agents by category keywords', () => {
  // given fixture agents with keywords ['development']
  // when category 'development' is selected
  // then only matching agents remain visible
});

// Bridge 등록 성공 시 캐시 무효화 훅
const { mutateAsync } = useRegisterBridge({
  onSuccess: () => {
    queryClient.invalidateQueries(BRIDGE_QK.list);
    queryClient.invalidateQueries(BRIDGE_QK.ids);
  },
});
```

## Todo

- [x] SubAgentManager 카테고리 필터 단위 테스트 보강
- [x] Bridge 등록 다이얼로그 유효/무효 입력 및 캐시 무효화 테스트 추가
- [ ] Dashboard 카드 로딩/에러/Retry 컴포넌트 테스트 작성 및 지표 하드코딩 제거 마무리
- [ ] Knowledge 마이그레이션 유틸 초안(파일→Core) 설계 및 프로토타입 구현
- [ ] MCP usage 이벤트 스트림 구독 훅/컴포넌트 업데이트 및 테스트 추가
- [ ] renderer 테스트 커버리지 가이드라인 문서화 (coverage 목표, 주요 시나리오 명시)

## 작업 순서

1. **테스트 보강 라운드**: SubAgentManager/Bridge 등록/Dashboard 카드 테스트 추가 및 하드코딩 제거 (완료 조건: vitest renderer 통과, TODO 체크).
2. **MCP 이벤트 통합**: usage.events 스트림을 GUI에 반영하고 관련 테스트 작성 (완료 조건: 실시간 갱신 확인 + 테스트 통과).
3. **Knowledge 마이그레이션 프로토타입**: localStorage → Core 전환을 위한 헬퍼 및 전략 문서화 (완료 조건: 최소 happy path 동작 + 계획서 업데이트).
4. **테스트 커버리지 문서화**: renderer/main 테스트 가이드 및 커버리지 기준을 docs에 추가 (완료 조건: `apps/gui/docs/frontend/testing.md` 갱신).

## QA & Visual Verification

- [x] Playwright MCP를 이용해 `http://localhost:5173` UI를 직접 검토하고, SubAgentManager 카테고리 필터 및 브릿지 등록 UI가 기존 Figma 디자인과 시각적으로 어긋남 없이 동작함을 확인했다. (2025-09-19)

