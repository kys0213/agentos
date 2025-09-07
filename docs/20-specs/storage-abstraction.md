# Storage Abstraction Spec (Directional Draft)

> 상태: 방향성 초안. 아래 인터페이스/규약은 스케치이며, 구현 과정에서 단순화/변경될 수 있습니다.

## TypeScript 인터페이스(스케치)

```ts
export interface Cursor { after?: string; limit?: number }
export interface Page<T> { items: T[]; next?: string }

export interface SessionSummary { id: string; agentId: string; updatedAt: string; title?: string; status?: string }
export interface MessageRecord { sessionId: string; ts: string; role: 'user'|'assistant'|'tool'; content: unknown }

export interface SessionStore {
  create(agentId: string, opts?: { sessionId?: string; presetId?: string }): Promise<{ id: string }>
  get(id: string): Promise<SessionSummary|null>
  list(filter?: { agentId?: string }, cursor?: Cursor): Promise<Page<SessionSummary>>
  appendMessages(sessionId: string, msgs: MessageRecord[]): Promise<void>
  history(sessionId: string, cursor?: Cursor): Promise<Page<MessageRecord>>
  terminate(sessionId: string): Promise<void>
}

export interface MemoryNode { id: string; kind: 'short'|'long'|'agent'; text: string; score?: number; meta?: any }
export interface MemoryStore {
  upsert(nodes: MemoryNode[]): Promise<void>
  search(query: string, k: number, opts?: { agentId?: string }): Promise<MemoryNode[]>
  evict(policy: { maxNodes?: number }): Promise<number>
}

export interface KnowledgeDoc { id: string; text: string; embedding?: number[]; meta?: any }
export interface KnowledgeIndex {
  add(docs: KnowledgeDoc[]): Promise<void>
  query(q: string, k: number, opts?: { hybrid?: boolean }): Promise<Array<{ id: string; score: number }>>
}

export interface UsageRecord { ts: string; agentId: string; model: string; tokensIn: number; tokensOut: number; costUsd?: number; latencyMs?: number }
export interface UsageStore {
  add(records: UsageRecord[]): Promise<void>
  aggregate(range: { from: string; to: string }, by: 'day'|'agent'|'model'): Promise<any>
}

export interface EventRecord { id: string; ts: string; type: string; payload: any }
export interface EventStore { append(events: EventRecord[]): Promise<void>; tail(cursor?: Cursor): Promise<Page<EventRecord>> }
```

## 어댑터 규약(가이드)

- File(JSONL): append-only, 롤링(크기/기간), 백압(backpressure) 시 배치 적용
- SQLite: 트랜잭션/락, 인덱스(세션/시간/agentId), WAL 권장
- HTTP Sync: 증분 업로드, idempotency_key(파일해시/배치ID), 서버 ACK 후 커밋

## 동기화(증분) 아이디어

```json
{
  "batch_id": "2025-09-06-001",
  "cursor": { "events_after": "evt_123" },
  "payload": { "events": [ /* EventRecord[] */ ] },
  "idempotency_key": "hash(batch)"
}
```

서버는 `{ ack_id, accepted, rejected }` 응답, 클라이언트는 ACK 후 outbox 정리.

## 일관성/충돌(가이드)

- 기본: 최종 일관성. 충돌은 타임스탬프 우선 + 벡터클록/Lamport(선택)로 해결
- 병합 불가 레코드는 서버 측 큐로 격리(수동 검토)

## 운영 지침(권장)

- 보존 정책: 세션/이벤트/사용량 보존기간 문서화(예: 90일), 장기 보관은 압축 아카이브로 이동
- 백업/복구: SQLite 백업 스냅샷 + JSONL 재생 로직 제공
