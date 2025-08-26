# GUI RPC Migration — Step 4 완료 보고

상위 문서: apps/gui/plan/RPC_MIGRATION_PLAN.md

## 완료 항목 요약

- 채널 표기 전환(콜론→도트): agent._, bridge._, preset._, mcp._, chat.\* 완료
- 렌더러 서비스 레이어: IpcChannel 의존 제거, RpcEndpoint/RpcClient 기반 동작
- 스트림 취소/가드: mcp.usage.events 취소 동작 통합 테스트, use-chat에 zod 가드 적용
- 문서 반영: IPC_TERMS_AND_CHANNELS.md, ELECTRON_MCP_IPC_SPEC.md 갱신(요약/마이그레이션 노트)
- 품질 검증: typecheck/lint 통과, 빌드는 CI에서 검증

## 변경 내역(핵심)

- ConversationRpcService 채널 전환: chat.list-sessions/get-messages/delete-session
- use-chat 훅: 런타임 가드(zod)로 chat 결과 최소 필드 검증(sessionId/messages)
- 테스트: mcp-usage.events-cancel 통합 테스트 추가(취소 시 'can' 전송 및 이벤트 중단)
- 문서: chat.\* 네임스페이스 표기 정리, colon→dot 전환 노트 추가
- 메시지 스펙: Message.content를 llm-bridge-spec의 MultiModalContent[] 배열로 고정(단일 값 암묵 변환 제거)

## TODO 체크(최종)

- [x] 채널 표기 전환(콜론→도트): agent/bridge/preset/mcp/conversation
- [x] 레거시 제거/치환: ipc-agent.ts, fetchers/\* (잔존 없음)
- [x] 훅/컨테이너 이관: Chat(가드 적용), Preset(서비스 경유)
- [x] 통합 테스트: mcp.usage.events 취소 검증
- [x] 문서 업데이트: 스펙/용어/마이그레이션 노트 반영

## 비고

- Electron IPC 레거시는 어댑터 레벨 파일만 잔존하며, 호출부는 모두 RpcEndpoint를 사용합니다.
- 향후 퍼포먼스 최적화(MessagePort 등)는 별도 작업으로 분리합니다.
