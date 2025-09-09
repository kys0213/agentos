# Knowledge System Plan (Index-first, File-based MVP)

본 문서는 Knowledge(지식베이스)와 Index(검색 인덱스)를 1급 개념으로 설계하는 Index-first 아키텍처를 정의합니다. 외부 계약(RPC/GUI)은 agentId 중심으로, 내부 코어는 knowledgeId(지식베이스 ID) 중심으로 동작하며, 파사드 계층에서 agentId → knowledgeId 매핑을 수행합니다.

## Principles

- Index-first: Knowledge 하위에 BM25/Vector 등 복수 인덱스를 보유하고, 하이브리드 검색은 IndexSet에서 병합.
- Boundary: 공개 계약은 agentId만 노출, 내부 코어는 knowledgeId 사용(역전파 차단).
- File-based MVP: 문서는 파일로 저장(DocStore), 인덱스는 파생물로 분리 관리.
- Non-blocking: 인덱싱은 큐/워커 기반 비차단 증분 처리, knowledgeId 단위 파일락.

## Requirements

- 에이전트별 지식베이스(knowledgeId) 생성/조회/삭제 및 문서 CRUD
- BM25 검색(MVP) + 향후 Vector/Hybrid 확장
- 안전한 파일 레이아웃, 용량 제약, 경로 traversal 방지
- 스니펫/하이라이트 생성 규칙(토크나이저/정규화와 일관)

## Architecture

- KnowledgeRepository: 지식베이스 수명주기 관리(create/get/list/delete)
- Knowledge: 문서 저장소 + 인덱스 세트 오케스트레이션(addDoc/deleteDoc/listDocs/query/reindex/stats)
- DocStore: 원문/메타 저장, 페이지네이션 제공
- KnowledgeIndex: BM25/Vector/Keyword 등 공통 인터페이스(addOrUpdate/remove/search/reindex/stats)
- IndexSet: 복수 인덱스 검색 병합(RRF 등), 선택적 재인덱싱 대상 지정
- Facade: agentId → knowledgeId 매핑 후 코어 호출(공개 계약은 agentId 중심)

## Interface Sketch

### 공개 계약(RPC/GUI) — agent 단위

- createDoc({ agentId, title, source(text|fileRef), tags[] }) → KnowledgeDoc
- listDocs({ agentId, cursor?, limit? }) → PageOf<KnowledgeDoc>
- deleteDoc({ agentId, docId }) → { success }
- reindex({ agentId, index?: string|string[] }) → { success }
- stats({ agentId }) → KnowledgeStatsByIndex
- search({ agentIds: string[], query, topK?, filters? }) → SearchHit[]

### 내부 코어(Store/Index) — knowledge 단위

- KnowledgeRepository.create/get/list/delete
- Knowledge.addDoc/deleteDoc/listDocs/query/reindex/stats
- KnowledgeIndex(kind='bm25' 등): addOrUpdate/remove/search/reindex/stats
- IndexSet: list/get/search(merge)/reindex
- DocStore: create/get/list/delete (원문 보관)

### 타입 요지(예시)

- KnowledgeDoc: `{ id, title, tags?, source(text|fileRef), createdAt, updatedAt, indexedAt?, status }`
- SearchQuery: `{ text, topK?, filters? }`
- SearchHit: `{ docId, score, highlights?, indexName }`
- IndexStats: `{ docCount, lastBuiltAt? }`

## Minimal Interfaces (Spring-Data 스타일 최소 표면)

아래 인터페이스는 벤더/백엔드에 독립적인 최소 공통 표면입니다. Core는 이 표면만 의존하고, 실제 벡터/키워드/외부 DB 어댑터는 앱 레이어에서 주입합니다.

```ts
// 식별자
type KnowledgeId = string & { readonly __brand: 'KnowledgeId' };
type DocId = string & { readonly __brand: 'DocId' };

// 도메인 문서
interface KnowledgeDoc {
  id: DocId;
  title: string;
  tags?: string[];
  source: { kind: 'text'; text: string } | { kind: 'fileRef'; path: string };
  createdAt: string;
  updatedAt: string;
  indexedAt?: string;
  status: 'draft' | 'ready' | 'indexing' | 'indexed' | 'failed';
}

// 인덱스에 투입되는 최소 레코드(백엔드 중립)
interface IndexRecord {
  id: DocId;
  fields: Record<string, string | number | string[]>;
  // 백엔드 특화 힌트(예: embedding)는 확장 슬롯으로 전달
  extensions?: Record<string, unknown>;
}

// 도메인 → 인덱스 레코드 매핑(앱 레이어에서 구현/주입)
interface DocumentMapper {
  toRecords(doc: KnowledgeDoc): AsyncIterable<IndexRecord>;
}

// 공통 쿼리/결과(특화 옵션은 extensions에 패스스루)
interface Query {
  text?: string;
  filters?: Record<string, unknown>;
  topK?: number;
  extensions?: Record<string, unknown>; // 예: { knn: { vector:[…], topK:50 } }
}
interface SearchHit {
  docId: DocId;
  score: number;
  highlights?: string[];
  indexName: string;
}
interface IndexStats {
  docCount: number;
  lastBuiltAt?: string;
}

// 최소 공통 인덱스 인터페이스
interface SearchIndex {
  readonly name: string; // 예: 'bm25', 'vector:custom'
  upsert(records: AsyncIterable<IndexRecord>): Promise<void>;
  remove(docIds: AsyncIterable<DocId>): Promise<void>;
  search(query: Query): Promise<SearchHit[]>;
  reindex(allRecords: AsyncIterable<IndexRecord>): Promise<void>;
  stats(): Promise<IndexStats>;
}

// 여러 인덱스를 묶어 호출(병합 정책 주입 가능)
interface MergePolicy {
  merge(results: Record<string, SearchHit[]>, topK: number): SearchHit[]; // RRF 등
}
interface IndexSet {
  list(): SearchIndex[];
  get(name: string): SearchIndex | undefined;
  search(q: Query, opts?: { indexes?: string[]; merge?: MergePolicy }): Promise<SearchHit[]>;
  reindex(
    mapper: DocumentMapper,
    docs: AsyncIterable<KnowledgeDoc>,
    target?: string | string[]
  ): Promise<void>;
}

// 문서 저장은 분리(인덱스는 파생물)
interface DocStore {
  create(
    input: Omit<KnowledgeDoc, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<KnowledgeDoc>;
  get(id: DocId): Promise<KnowledgeDoc | null>;
  list(cursor?: string, limit?: number): Promise<{ items: KnowledgeDoc[]; nextCursor?: string }>;
  delete(id: DocId): Promise<void>;
}

// Knowledge 애그리게이트(도메인 관점 최소 API)
interface Knowledge {
  id: KnowledgeId;
  addDoc(input: {
    title: string;
    source: KnowledgeDoc['source'];
    tags?: string[];
  }): Promise<KnowledgeDoc>;
  deleteDoc(id: DocId): Promise<void>;
  listDocs(p?: {
    cursor?: string;
    limit?: number;
  }): Promise<{ items: KnowledgeDoc[]; nextCursor?: string }>;
  query(q: Query, opts?: { indexes?: string[]; merge?: MergePolicy }): Promise<SearchHit[]>;
  reindex(opts?: { indexes?: string | string[] }): Promise<void>;
  stats(): Promise<Record<string, IndexStats>>;
}

// Knowledge 저장소(리포지토리)
interface KnowledgeRepository {
  create(params?: { name?: string; initialIndexes?: string[] }): Promise<Knowledge>;
  get(id: KnowledgeId): Promise<Knowledge | null>;
  list(p?: {
    cursor?: string;
    limit?: number;
  }): Promise<{ items: Knowledge[]; nextCursor?: string }>;
  delete(id: KnowledgeId): Promise<void>;
}
```

## DI 패턴(생성자 주입) & 구성

인덱스/매퍼/스토어를 생성자 주입하여 결합도를 낮춥니다. Core는 어떤 백엔드도 모릅니다.

```ts
// 1) 인덱스 준비(앱 레이어)
const bm25: SearchIndex = new Bm25Index({ baseDir: '/data/kb' });
const vector: SearchIndex = new CustomVectorIndex({
  /* 외부 연결 설정 */
});
const indexSet: IndexSet = new DefaultIndexSet([bm25, vector]);

// 2) 매퍼/스토어
const mapper: DocumentMapper = {
  async *toRecords(doc) {
    const text = doc.source.kind === 'text' ? doc.source.text : '';
    const fields = { title: doc.title, tags: (doc.tags ?? []).join(','), text };
    // 필요 시 embeddings 등은 extensions에 넣음(벡터 인덱스만 해석)
    const embedding = await embedder.embedText(text);
    yield { id: doc.id, fields, extensions: { embedding } };
  },
};
const store: DocStore = new FileDocStore({ baseDir: '/data/kb' });

// 3) 리포지토리 생성
const repo = new KnowledgeRepositoryImpl({
  docStore: store,
  indexSet,
  mapper,
  defaultMerge: new RRFPolicy(),
});
const kb = (await repo.get('kb-123')) ?? (await repo.create({ name: 'AgentA KB' }));
```

## Usage Examples (Pseudo Code)

문서 추가(비차단 인덱싱)

```ts
const doc = await kb.addDoc({
  title: 'RAG 설계 노트',
  source: { kind: 'text', text: '# RAG...' },
  tags: ['rag'],
});
// 내부: DocStore.save → JobQueue.enqueue({ knowledgeId:'kb-123', docId:doc.id })

// 워커: mapper.toRecords(doc) → indexSet.list().forEach(idx => idx.upsert(records))
```

검색(단일/하이브리드)

```ts
// BM25
const hits1 = await kb.query({ text: '인덱싱 락' }, { indexes: ['bm25'] });

// Vector(확장 옵션 사용)
const qv = await embedder.embedText('retrieval augmented');
const hits2 = await kb.query(
  { extensions: { knn: { vector: qv, topK: 20 } } },
  { indexes: ['vector:custom'] }
);

// 하이브리드 병합(RRF)
const hits3 = await kb.query(
  { text: '스니펫 규칙' },
  { indexes: ['bm25', 'vector:custom'], merge: new RRFPolicy() }
);
```

재인덱싱/삭제

```ts
await kb.reindex({ indexes: ['vector:custom'] });
await kb.deleteDoc(doc.id);
```

외부 계약(RPC/GUI) 경계

```ts
// GUI → 서버
await rpc.kb.createDoc({ agentId, title, source, tags });

// 서버 파사드: agentId → knowledgeId 매핑 후 코어 호출
const knowledgeId = mapAgentToKnowledge(agentId);
const kb = (await repo.get(knowledgeId)) ?? (await repo.create());
return await kb.addDoc({ title, source, tags });
```

## File Layout (MVP)

- `knowledge/<knowledgeId>/manifest.json`(지식베이스 메타: 인덱스 목록/생성일 등)
- `knowledge/<knowledgeId>/docs/<docId>.json|txt`
- `knowledge/<knowledgeId>/indexes/bm25/{postings.bin, docmap.json, manifest.json}`
- `knowledge/<knowledgeId>/indexes/vector/{index-file..., manifest.json}`

## BM25 Index Spec

- kind: `bm25`
- manifest: `{ version, tokenizer, stopwords?, lang, k1, b, weights, docCount, lastBuiltAt }`
- 파일: `postings.bin`, `docmap.json`, `manifest.json`
- 메서드: `addOrUpdate/remove/search/reindex/stats`
- 비고: 문서별 인덱스는 IDF/랭킹 품질 저하로 비권장, knowledge 단일 인덱스 유지

## Incremental & Locking

- 큐 기반 비차단 증분 빌드(작업 단위: knowledgeId)
- 파일락 정책: `indexes/bm25/*` 쓰기 시 단일 락, 읽기는 낙관적 락 + 재시도
- 재인덱싱: 전체 문서 스트림 → 대상 인덱스만 선택적 재생성 가능

## Snippet/Highlighting

- 토크나이저/정규화 파이프라인과 동일 규칙 사용
- 문서별 오프셋/토큰맵은 `docmap.json`에 유지(스니펫 범위 산출)

## Todo

- [ ] 파일 포맷 세부/엔디안/버전 정책(포스팅/도크맵/매니페스트)
- [ ] 증분 전략/락 정책(knowledge 단위 큐 + 파일락) 구체화
- [ ] BM25 파라미터 기본값(k1,b,weights) 및 토크나이저 초기값
- [ ] Knowledge/Repository/Index/DocStore 인터페이스 스켈레톤 작성 및 단위 테스트 틀
- [ ] 공개 계약을 agentId 기반으로 정리하고, 파사드 매핑 설계/문서화
- [ ] GUI Knowledge 연동(로컬스토리지 제거, 계약 교체)

## Extensibility & Guidelines

- 확장 슬롯: 백엔드 특화 옵션은 `Query.extensions`, `IndexRecord.extensions`를 통해 전달(벤더 의존 최소화).
- DI/테스트: `SearchIndex` 모킹으로 단위 테스트 용이. 인덱싱 워커는 큐 인터페이스만 의존.
- 하이브리드: 병합 정책(RRF, z-score 등)은 주입형으로 구현하고 Core는 호출만 수행.
- 멀티테넌시: `knowledgeId`는 네임스페이스/컬렉션 안전 식별자로 매핑(hash/slug).

## Notes

- 향후 Vector/Hybrid 인덱스는 `KnowledgeIndex` 확장으로 추가하며, IndexSet에서 병합 정책(RRF 등)을 적용
- 긴 단일 문서 내부 탐색은 별도 기능로 분리(문서별 인덱스 아님)
- 언어/스톱워드 튜닝 및 다국어 토크나이저 설정은 후속 단계
