# 작업계획서: SubAgent 마법사 LLM Bridge 검증 버그 수정

## Requirements

### 성공 조건
- [ ] LLM Bridge를 선택했음에도 `Select an LLM bridge before continuing.` 경고가 뜨는 문제가 재현되지 않는다.
- [ ] 검증 실패 시 콘솔과 `ELECTRON_RPC_TRACE` 로그에서 bridgeId, bridgeConfig 상태를 추적할 수 있다.
- [ ] 단위/E2E 테스트를 통해 Ollama 브리지 선택 흐름이 안정적으로 통과한다.

### 사용 시나리오
- 사용자가 AI Config 단계에서 Ollama 브리지를 선택하고 모델을 고른 후 다음 단계로 이동할 때 오류 없이 진행된다.
- 동일한 흐름을 Playwright E2E(`subagent-create-flow`)로 재현해도 경고가 발생하지 않는다.

### 제약 조건
- ServiceContainer 기반 구조와 현행 UI를 유지한 채 버그만 수정한다.
- 기존 Export/Import UI 위치는 이 작업에서 변경하지 않는다.

## Interface Sketch
```typescript
interface BridgeValidationDebugInfo {
  bridgeId: string | undefined;
  bridgeConfig: Record<string, unknown>;
  effectiveConfig: Record<string, unknown>;
}
```

## Todo
- [ ] `BridgeModelSettings` onChange 흐름 분석 (console/group 로그 추가)
- [ ] `bridgeId` 상태 업데이트 타이밍 수정 및 validator 보강 (`trim`, fallback)
- [ ] `ELECTRON_RPC_TRACE`와 함께 renderer 측 디버그 로그 활성화
- [ ] 단위 테스트 확장 (`SubAgentCreate.steps.test.tsx` 등)
- [ ] Playwright E2E 재검증 (`subagent-create-flow`)
- [ ] 버그 수정 내용 문서화 (Frontend testing guide 업데이트)

## 작업 순서
1. 로그 추가 후 문제 재현(Dev/E2E) → 원인 진단
2. 상태 업데이트 및 validator 수정 → 단위 테스트 보강
3. E2E 재실행 → 문서 업데이트 및 정리
