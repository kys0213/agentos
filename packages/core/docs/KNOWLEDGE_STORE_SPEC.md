# Knowledge Store Spec (Core)

목표: 파일 기반 지식 문서 저장 + BM25 검색(MVP), 이후 확장(벡터) 가능 구조.

- 저장 루트: `${APP_USER_DATA}/knowledge/<agentId>/`
- 디렉터리 레이아웃
  - `docs/<docId>.{md|txt}`: 원문 파일
  - `meta/<docId>.json`: 메타데이터({ id, title, tags[], createdAt, updatedAt, size, mimeType })
  - `index/bm25/`:
    - `manifest.json`: { version, tokenizer, stopwords, lang, docCount, lastBuiltAt }
    - `postings.bin`: 역색인(토큰→문서ID/빈도), 바이너리
    - `docmap.json`: { docId → docLength, fieldWeights? }
    - `vocab.json`: 토큰 사전(선택)

원자성/일관성
- 문서/메타 쓰기 → 인덱스 큐(enqueue) → 비차단 인덱싱 → `manifest.json` 갱신
- 파일 잠금 또는 락 파일로 postings/docmap 교체 시 충돌 방지

API(코어 서비스 개요)
- createDoc({ agentId, title, content|fileRef, tags[] }) → KnowledgeDoc
- listDocs({ agentId, cursor?, limit? }) → PageOf<KnowledgeDoc>
- deleteDoc({ agentId, docId }) → { success }
- indexDoc({ agentId, docId }) → { success } // 큐 enqueue
- stats({ agentId }) → KnowledgeStats
- search({ agentId, query, topK?, filters? }) → SearchResult[]

타입(개요)
- KnowledgeDoc: { id, agentId, title, tags[], createdAt, updatedAt, size, type: 'markdown'|'text' }
- KnowledgeStats: { totalDocuments, indexedDocuments, lastUpdated, storageSize }
- SearchResult: { docId, score, title, snippet }

제약/보안
- 파일 크기/총 용량 제한(예: 5MB/500MB)
- 텍스트만 허용(MVP), 바이너리 금지
- 경로 traversal 방지: `docId`는 UUID 내부 생성

버전/마이그레이션
- `manifest.version` 증가 시 전체 재빌드 필요
- 토크나이저/스톱워드 변경 시 호환성 주의/마이그레이션 제공

