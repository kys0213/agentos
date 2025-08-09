# Core Knowledge System Design (Draft)

## Requirements

### 성공 조건
- [ ] 프리셋별 지식 문서(초기: Markdown)를 등록/삭제/검색 가능
- [ ] BM25 기반 인메모리 인덱스 검색 지원
- [ ] 벡터DB 검색 지원(플러그블 드라이버)
- [ ] BM25 + 벡터 하이브리드 검색 지원(가중치/집계 전략 설정 가능)
- [ ] 테스트(단위/통합) 통과 및 타입 안정성

### 사용 시나리오
- 프리셋 생성 시 관련 지식 문서를 업로드(초기: .md 파일)
- 질문이 들어오면 프리셋 컨텍스트로 해당 지식에서 최적 문단을 검색하여 컨텍스트로 제공
- 검색 모드는 BM25/Vector/Hybrid 중 선택, 기본값은 Hybrid

### 제약 조건
- 초기 파일 포맷은 Markdown(.md)만 지원. 추후 PDF/HTML 확장 예정(OCP)
- 외부 의존(벡터DB)은 네트워크 실패 대비 타임아웃/백오프 필요(테스트는 모킹)
- 코어는 특정 DB/런타임에 종속되지 않음(드라이버/어댑터로 분리)

## Interface Sketch

```typescript
// Domain
export type PresetId = string & { readonly __brand: 'PresetId' };
export type KnowledgeDocId = string & { readonly __brand: 'KnowledgeDocId' };

export interface KnowledgeDocumentMeta {
  id: KnowledgeDocId;
  presetId: PresetId;
  title: string;
  uri?: string; // 원천 경로(선택)
  createdAt: Date;
  updatedAt: Date;
  mimeType: 'text/markdown'; // 초기 고정, 추후 확장
}

export interface KnowledgeChunk {
  docId: KnowledgeDocId;
  chunkId: string;
  text: string;
  position: number; // 문서 내 순서
}

// Parser (OCP: 포맷별 파서 교체 가능)
export interface KnowledgeParser {
  canParse(mimeType: string): boolean;
  parse(content: string, meta: KnowledgeDocumentMeta): Promise<KnowledgeChunk[]>;
}

export interface BM25IndexOptions {
  k1?: number; // 기본 1.2~2.0
  b?: number;  // 기본 0.75
  tokenizer?: (text: string) => string[];
}

export interface BM25Index {
  add(doc: KnowledgeDocId, chunks: KnowledgeChunk[]): void;
  remove(doc: KnowledgeDocId): void;
  search(query: string, topK: number): Array<{ chunk: KnowledgeChunk; score: number }>;
}

export interface VectorIndexOptions {
  dimension: number;
}

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>; // 배치 임베딩
}

export interface VectorIndex {
  upsert(doc: KnowledgeDocId, chunks: KnowledgeChunk[], embeddings: number[][]): Promise<void>;
  remove(doc: KnowledgeDocId): Promise<void>;
  search(embedding: number[], topK: number): Promise<Array<{ chunk: KnowledgeChunk; score: number }>>;
}

export type HybridStrategy =
  | { type: 'linear'; alpha: number } // score = alpha*bm25 + (1-alpha)*vec
  | { type: 'rrf'; k?: number }       // Reciprocal Rank Fusion
  | { type: 'rank-merge' };

export interface KnowledgeSearchOptions {
  mode: 'bm25' | 'vector' | 'hybrid';
  topK?: number; // 기본 5
  hybrid?: HybridStrategy;
}

export interface KnowledgeRepository {
  addDocument(meta: KnowledgeDocumentMeta, content: string): Promise<void>;
  removeDocument(docId: KnowledgeDocId): Promise<void>;
  listDocuments(presetId: PresetId): Promise<KnowledgeDocumentMeta[]>;
  search(presetId: PresetId, query: string, options?: KnowledgeSearchOptions): Promise<Array<{ chunk: KnowledgeChunk; score: number }>>;
}

// Factories (OCP: 구현체 교체 용이)
export interface KnowledgeComponents {
  parser: KnowledgeParser;
  bm25: BM25Index;
  vector?: VectorIndex;
  embedder?: EmbeddingProvider;
}

export interface KnowledgeRepositoryFactory {
  create(components: KnowledgeComponents): KnowledgeRepository;
}
```

## Design Notes (OCP 우선)
- Parser, BM25Index, VectorIndex, EmbeddingProvider, Repository를 인터페이스로 분리하여 교체/확장이 용이
- Markdown 외 포맷 추가 시 Parser만 추가하면 코어 변경 없이 확장 가능
- 벡터DB 드라이버(local faiss-like, external http 등)를 `VectorIndex` 구현으로 플러그인화
- 하이브리드 전략을 전략 패턴으로 분리해 새로운 랭킹 결합 방식 추가 시 OCP 유지
- Preset별 파티셔닝은 `doc.meta.presetId` 기반의 인덱스 네임스페이스로 구현

## Todo
- [ ] Knowledge 도메인 타입/인터페이스 추가
- [ ] MarkdownParser 기본 구현 + 테스트
- [ ] InMemoryBM25Index 기본 구현(k1,b,토크나이저) + 테스트
- [ ] VectorIndex 추상화 + 더미 메모리 구현 + 테스트
- [ ] Hybrid 검색 결합기(Linear, RRF) + 테스트
- [ ] InMemoryKnowledgeRepository 구현(프리셋별 문서/인덱스 관리) + 테스트
- [ ] 문서화 및 샘플 코드 추가

## 작업 순서
1. 타입/인터페이스 정의(도메인, 인덱스, 리포지토리) — 완료 조건: 타입레이어 컴파일 성공
2. MarkdownParser/InMemoryBM25Index 미니 구현 — 완료 조건: 단위 테스트 통과
3. VectorIndex/EmbeddingProvider 더미 구현 — 완료 조건: 검색 end-to-end 샘플 동작
4. Hybrid 결합 전략(Linear, RRF) — 완료 조건: 랭킹 결합 테스트 통과
5. InMemoryKnowledgeRepository — 완료 조건: 프리셋별 등록/검색 E2E 테스트 통과
6. 문서/README 업데이트
