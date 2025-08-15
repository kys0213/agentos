# 작업계획서: Agent IPC를 core 기반으로 정합화

## Requirements

### 성공 조건

- [ ] `agent:*` IPC가 packages/core 타입과 동작에 맞게 구현된다.
- [ ] `agent:get-all-metadatas`는 항상 `AgentMetadata[]`(배열)를 반환한다.
- [ ] `agent:create/update/delete/get`는 File 저장소를 통해 영속되고 스키마(type)를 준수한다.
- [ ] `agent:chat/end-session`은 활성 브릿지 + core `SimpleAgent`로 수행된다(폴백은 에코).
- [ ] 렌더러 훅(`useAppData`)에서 map/filter 호출 시 타입 안정성이 보장된다(빈 배열 보장).

### 사용 시나리오

- GUI(렌더러)에서 설정/관리/대시보드에서 에이전트 목록을 조회하고, 생성/수정/삭제가 정상 동작한다.
- 채팅 시작 시 `agent:chat`으로 세션이 생성되고, 메시지 송수신이 가능하다.

### 제약 조건

- 브릿지가 없을 때는 안전하게 에코 폴백으로 동작(실 브릿지 의존 제거).
- 파일 저장소 경로는 `app.getPath('userData')/agents` 사용.

## Interface Sketch

```ts
// main: agent-ipc-handlers.ts
ipcMain.handle('agent:get-all-metadatas', async () => {
  const repo = getOrInitAgentRepo();
  const res = await repo.list({ limit: 1000, cursor: '', direction: 'forward' });
  return res.items; // 항상 배열
});

ipcMain.handle('agent:get-metadata', async (_, id) => repo.get(id));
ipcMain.handle('agent:create', async (_, data: CreateAgentMetadata) => repo.create(data));
ipcMain.handle('agent:update', async (_, id, patch) => repo.update(id, patch));
ipcMain.handle('agent:delete', async (_, id) => { const m = await repo.get(id); await repo.delete(id); return m; });

ipcMain.handle('agent:chat', async (_, agentId, messages, options) => {
  const meta = await repo.get(agentId);
  const agent = createSimpleAgent(agentId, meta); // 활성 브릿지 필요
  if (agent) return agent.chat(messages, options);
  return echo(messages, options); // 폴백
});
```

## Todo

- [ ] FileAgentMetadataRepository로 IPC 핸들러 교체(get/list/create/update/delete)
- [ ] `agent:get-all-metadatas` 배열 보장(빈 배열 포함)
- [ ] `agent:chat/end-session`에서 core SimpleAgent 사용 + 에코 폴백 유지
- [ ] 렌더러 방어 로깅(비정상 응답 시 경고) 및 빈 배열 처리 점검
- [ ] 타입체크/빌드/간단 시나리오 검증(Playwright MCP로 Models/Settings)
- [ ] 문서 업데이트(AGENT_API_ALIGNMENT_CHANGELOG.md)

## 작업 순서

1. IPC 핸들러를 저장소 기반으로 리팩터링 (완료 조건: 배열 보장, 타입세이프)
2. 채팅/세션 종료 경로를 core SimpleAgent로 정리 (완료 조건: 브릿지 있을 때 정상 동작)
3. 렌더러 훅 방어 로직 점검 (완료 조건: map/filter 예외 미발생)
4. 타입체크/로컬 검증 및 문서화 (완료 조건: tsc 0, 간단 시나리오 통과)

