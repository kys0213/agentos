# 작업계획서: GUI ModelManager ↔ Electron Main LLM Bridge 연동

## Requirements

### 성공 조건

- [ ] ModelManager가 Electron Main에서 관리하는 설치된 LLM 브릿지 목록을 표시한다.
- [ ] 활성 브릿지를 명확히 표시하고 전환(switch)할 수 있다.
- [ ] Spec(`llm-bridge-spec`의 `LlmManifest`) 기반으로 Capabilities를 표시한다.
- [ ] 기존 mock 의존 로직 제거, IPC(`bridge:*`)만 사용.

### 사용 시나리오

- [ ] 앱 실행 시 `getBridgeIds()`→각 `getBridgeConfig(id)`로 카드 렌더링.
- [ ] `getCurrentBridge()`로 활성 상태 온라인/오프라인 뱃지 표시.
- [ ] 사용자가 카드에서 `Switch` 클릭 → `switchBridge(id)` 호출 후 UI 갱신.
- [ ] (선택) 마켓플레이스는 추후 별도 카탈로그 도입 전까지 숨김/단순화.

### 제약 조건

- [ ] 가격/프로바이더/엔드포인트/키/사용량·성능 메트릭은 현재 IPC/Spec에 없음.
- [ ] 해당 필드는 임시 비표시 또는 대체 표기로 축소한다.

## Interface Sketch

```typescript
// Renderer 사용 API (이미 존재)
bridge.registerBridge(config: LlmManifest): Promise<{ success: boolean }>;
bridge.unregisterBridge(id: string): Promise<{ success: boolean }>;
bridge.switchBridge(id: string): Promise<{ success: boolean }>;
bridge.getCurrentBridge(): Promise<{ id: string; config: LlmManifest } | null>;
bridge.getBridgeIds(): Promise<string[]>;
bridge.getBridgeConfig(id: string): Promise<LlmManifest | null>;

// Model 데이터 뷰 모델 예시
type InstalledBridgeVM = {
  id: string;
  manifest: LlmManifest;
  isActive: boolean;
  capabilityLabels: string[]; // modalities + supports* 를 문자열로 변환
}
```

## Todo

- [x] ModelManager에서 mock 타입/데이터 제거
- [x] `getBridgeIds`+`getBridgeConfig`로 목록 로딩 구현
- [x] `getCurrentBridge`로 활성 상태 계산 로직 구현
- [x] Capabilities 표시 변환 유틸 구현(modalities/supports\* → 배지)
- [x] Switch 버튼 → `switchBridge(id)` 연결 및 재로딩 처리
- [x] 마켓플레이스 탭 임시 단순화 또는 숨김(카탈로그 도입 전)
- [x] 경계 케이스 처리(브릿지 0개, 오류 메시지 UX)
- [x] 문서 업데이트(사용자 관점: 무엇이 바뀌었나)

## 작업 순서

1. 목록/상태만 우선: mock 제거 → IPC 연동(설치 목록/활성 표시)
2. Capabilities 배지 변환 추가(명확한 표기)
3. Switch 동작/갱신 처리 및 에러 핸들링
4. 마켓플레이스 탭 임시 조정 및 문서화
