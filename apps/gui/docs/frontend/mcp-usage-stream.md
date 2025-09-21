# MCP Usage Stream Integration

MCP Tools Manager가 `usage.events` 스트림을 통해 전달되는 실시간 사용량 변화를 UI에 반영하도록 정비한 결과를 기록합니다. 이 문서는 계획(기존 `apps/gui/plan/MCP_USAGE_STREAM_INTEGRATION_PLAN.md`) 완료 후 정리된 SSOT입니다.

## 구현 요약

- `useMcpUsageStream` 훅에서 최신 이벤트를 구독해 MCP Tools Manager로 전달하는 파이프라인을 확립했습니다.
- 도구 상태 카드, 최근 사용 로그, 총 사용량 요약이 이벤트 수신 후 즉시 갱신되며 수동 새로고침 없이 최신 상태를 유지합니다.
- 최대 100개의 최근 로그를 보관하며, 이벤트 입력 시 타임스탬프/도구 식별 값이 정규화됩니다.

## 이벤트 처리 세부 사항

- 새 이벤트 타입(`usage-logged`, `metadata-updated`, `connection-changed`)을 우선 파싱하고, 기존 서버가 발행하는 레거시 이벤트(`mcp.usage.log.created`, `mcp.usage.stats.updated`)도 호환성 레이어를 통해 변환합니다.
- `convertLegacyMcpUsageEvent` 헬퍼가 레거시 로그 이벤트를 `usage-logged` 구조로 변환하여 UI 변경이 필요 없습니다. 통계 이벤트는 대시보드 재조회로 커버되므로 스트림에서는 무시합니다.
- MCP Tools Manager는 이벤트 타입별 헬퍼(`applyUsageLoggedEvent`, `applyMetadataUpdatedEvent`, `applyConnectionChangedEvent`)를 사용해 도구 배열과 사용량 요약을 갱신합니다.

## 테스트 및 검증

- 렌더러 테스트에서 레거시 이벤트 → 최신 이벤트 변환 경로를 검증해 회귀를 방지합니다 (`McpToolManager.stream.test.tsx`, `use-mcp-usage-stream.test.tsx`).
- 빈 상태/에러 상태 테스트는 스트림 훅을 목킹하여 훅 미스매치를 방지하고, 서비스 컨테이너 더블로 초기 로딩 흐름을 검증합니다.
- `pnpm test --filter renderer -- --runInBand`, `pnpm lint`, `pnpm typecheck`로 CI와 동일한 검증 절차를 수행했습니다.

## 남은 과제

- 백엔드가 신규 이벤트 타입을 정식으로 도입하면 레거시 변환 로직을 제거할 계획입니다.
- 대시보드에서 실시간 사용량 변화(총 사용량/성공·실패 비율)를 시각적으로 노출하는 추가 UX는 Phase 3 문서에서 추적합니다.
