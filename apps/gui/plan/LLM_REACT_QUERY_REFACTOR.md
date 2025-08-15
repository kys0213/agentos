# 작업계획서: LLM 컴포넌트 React Query 리팩터링

## Requirements

### 성공 조건
- [ ] `apps/gui/src/renderer/components/llm/*` 컴포넌트들이 React Query 기반 데이터 흐름으로 전환된다.
- [ ] `ServiceContainer` 직접 호출/로컬 상태 기반 fetching 제거, 공용 hooks로 일원화된다.
- [ ] 브릿지 목록/상세/활성 전환이 Query Key/Invalidation 규칙에 따라 일관되게 갱신된다.
- [ ] 로딩/에러/빈 상태 UX가 명확히 표현된다.
- [ ] 타입 안전(Manifest/Capabilities) 유지 및 any 사용 금지.

### 사용 시나리오
- [ ] ModelManager가 `useBridgeIds` + `useBridgeConfig`(배치)로 설치 목록과 Capabilities를 표시한다.
- [ ] 현재 활성 브릿지는 `useCurrentBridge`로 상태가 유지되며, `useSwitchBridge` 성공 시 목록/상태가 갱신된다.
- [ ] LLMSettings/LlmBridgeManager 등 관련 화면들도 동일한 hooks를 사용한다.

### 제약 조건
- [ ] 가격/프로바이더/사용량 등 Manifest 범위 밖의 정보는 표시하지 않는다(플레이스홀더 유지).
- [ ] 설치/제거(등록/해제)는 IPC 지원 범위 내에서만 처리(없는 기능은 버튼 비활성/주석 처리).

## Interface Sketch

```ts
// Query Keys (단일 소스)
export const BRIDGE_QK = {
  current: ['bridge', 'current'] as const,
  ids: ['bridge', 'ids'] as const,
  config: (id: string) => ['bridge', 'config', id] as const,
  list: ['bridge', 'list'] as const, // 합성: ids + configs
};

// Existing hooks (apps/gui/src/renderer/hooks/queries/use-bridge.ts)
useCurrentBridge(): UseQueryResult<{ id: string; config: LlmManifest } | null>
useBridgeIds(): UseQueryResult<string[]>
useBridgeConfig(id: string): UseQueryResult<LlmManifest | null>
useSwitchBridge(): UseMutationResult<{ success: boolean }, unknown, string>

// New composite hook
useInstalledBridges(): {
  data: { id: string; manifest: LlmManifest }[] | undefined;
  isLoading: boolean;
  error?: unknown;
}
// 구현: ids를 받아 useQueries(or Promise.all)로 각 config를 병렬 호출 → undefined/null 필터링
// 성공 시 BRIDGE_QK.list에 캐시, switch/register/unregister 시 invalidate

// Utility
toCapabilityLabels(manifest: LlmManifest): string[]
```

## Todo
- [x] 공용 Query Keys 정리 및 `useInstalledBridges` 훅 추가 (hooks/queries/use-bridge.ts 또는 새 파일)
- [x] ModelManager: ServiceContainer 직접 호출 제거 → hooks 사용 + 상태/UX 갱신
- [x] LlmBridgeManager: 등록/목록/현재 상태 로딩을 hooks로 전환, 불필요 상태 제거
- [x] LLMSettings: 현 hooks 유지하되 invalidate 전략 점검(전환 시 list/current 무효화)
- [x] 에러/빈 상태/로딩 skeleton 통일 스타일 적용
- [x] 문서 업데이트 (apps/gui/docs/MODEL_MANAGER_BRIDGE_INTEGRATION.md 보강: hooks/키/무효화 규칙)
- [ ] 간단 스냅샷 테스트 or 로직 단위 테스트(훅 레벨) 초안 (선택)

## 작업 순서
1. Hooks 확장: `useInstalledBridges` + Query Key 상수 정리 (완료 기준: ids+configs 병렬 로딩, 타입 안전)
2. ModelManager 전환: hooks 기반 렌더링/검색/전환, 에러/빈 상태 반영 (완료 기준: 수동 fetch/remove 제거)
3. LlmBridgeManager 전환: 등록/목록/현재 상태를 hooks로 (완료 기준: ServiceContainer 직접 호출 제거)
4. LLMSettings 점검: 전환 후 invalidate 규칙 보강 (완료 기준: 전환 시 UI 일관 갱신)
5. 문서화/정리: 문서/주석/가이드 보강, 필요 시 경량 테스트 추가
