# 작업계획서: SubAgent Export/Import UI 재배치

## Requirements

### 성공 조건
- [ ] `SubAgentCreate` 컴포넌트에서 Export/Import UI 요소를 제거한다.
- [ ] ManagementView(또는 Agent 상세 뷰)에 Export/Import 버튼을 추가해 동일 기능을 제공한다.
- [ ] 기존 직렬화 포맷(`serializeAgent`, `tryParseAgentExport`)과 동작은 그대로 유지된다.
- [ ] 최소 1개의 E2E 또는 단위 테스트로 새 위치에서 Export/Import가 정상 동작함을 검증한다.

### 사용 시나리오
- 에이전트 목록에서 특정 에이전트를 선택한 뒤 `Export` 버튼을 클릭하면 JSON을 다운로드/클립보드로 복사할 수 있다.
- `Import` 버튼으로 JSON을 붙여넣어 에이전트 설정을 업데이트할 수 있다.

### 제약 조건
- LLM Bridge/MCP 설정 로직에는 영향을 주지 않는다.
- 브라우저/Electron 환경 모두에서 동작해야 한다.

## Interface Sketch
```typescript
interface AgentExportActionsProps {
  agentId: string;
  onExport: (agentId: string) => Promise<void>;
  onImport: (agentId: string, json: string) => Promise<void>;
}
```

## Todo
- [ ] `SubAgentCreate.tsx`에서 Export/Import 관련 state와 UI 제거
- [ ] ManagementView(또는 `AgentDetailPanel`)에 Export/Import 컴포넌트 추가
- [ ] `agent-export.ts` 유틸 재사용 및 토스트/모달 UX 결정
- [ ] 기존 테스트(`SubAgentCreate.import.test.tsx`) 업데이트
- [ ] 새 위치에서의 흐름을 검증하는 E2E/단위 테스트 추가
- [ ] 문서 업데이트 (Frontend docs: Agent Export/Import)

## 작업 순서
1. 기존 UI 제거 → 영향 파일 정리 (`SubAgentCreate.tsx`, `SubAgentCreateContainer.tsx`)
2. 새 위치에 Export/Import UI 추가 및 동작 확인
3. 테스트/문서 정리
