# GUI RPC Migration — Step 3 결과 요약

> 상위 계획서: apps/gui/plan/RPC_MIGRATION_PLAN.md

## 요구사항 충족 여부

- [x] Preload에 이벤트 구독/요청 API: `electronBridge.on`, `rpc.request`
- [x] Renderer 전송 계층: 프레임 기반 `RpcEndpoint`/채널 팩토리 구현
- [x] RPC 서비스 1차 추가 및 등록: Agent/Bridge/Preset/MCP/MCPUsage/Conversation
- [x] Bootstrap에 RPC 서비스 등록 및 ServiceContainer 연동
- [x] 문서/가이드 초안 업데이트(스펙/용어/코드 스타일)
- [x] 세션 메시지 이벤트 브로드캐스트(초기) 경로 연결

## 주요 변경 사항

- 전송 계층
  - `apps/gui/src/renderer/rpc/rpc-endpoint.ts`: 프레임(`req/res/err/nxt/end/can`) 기반 엔드포인트 구현
  - `apps/gui/src/renderer/rpc/rpc-channel.factory.ts`: 채널 기반 트랜스포트 구성
- 서비스 추가(1차)
  - `apps/gui/src/renderer/rpc/services/agent.service.ts`
  - `apps/gui/src/renderer/rpc/services/bridge.service.ts`
  - `apps/gui/src/renderer/rpc/services/preset.service.ts`
  - `apps/gui/src/renderer/rpc/services/mcp.service.ts`
  - `apps/gui/src/renderer/rpc/services/mcp-usage.service.ts`
  - `apps/gui/src/renderer/rpc/services/conversation.service.ts`
- 부트스트랩/등록
  - `apps/gui/src/renderer/bootstrap.ts`: 모든 RPC 서비스 컨테이너 등록 및 DI 연결
- 문서
  - `apps/gui/docs/ELECTRON_MCP_IPC_SPEC.md`, `apps/gui/docs/IPC_TERMS_AND_CHANNELS.md`, `apps/gui/docs/GUI_CODE_STYLE.md` 정합성 점검 및 활용

## 검증(요약)

- 타입 체크: 통과
- 빌드: 통과
- 테스트: 기본 단위 테스트 통과(스트림 취소/에러 전파는 Step 4/5에서 확대 검증)
- 수동 점검: RPC 요청/간단 스트림 구독 정상 동작 확인

## 비고 / 후속 작업(다음 단계)

- Step 4: 채널 표기 colon → dot 전환 및 훅/컨테이너 이관, IpcChannel 의존 제거
- Step 5: 통합 테스트(E2E 유사) 보강, 스트림 취소/타임아웃/에러 전파 검증 강화

