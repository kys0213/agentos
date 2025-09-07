# Knowledge Store Plan (File-based, BM25 MVP)

## Requirements
- 파일 기반 문서 저장, BM25 검색만 지원(MVP)
- 인덱싱은 비차단(백그라운드) 수행, API는 큐에 enqueue
- 안전한 파일 레이아웃과 용량 제약, 경로 traversal 방지

## Interface Sketch
- createDoc({ agentId, title, content|fileRef, tags[] }) → KnowledgeDoc
- listDocs({ agentId, cursor?, limit? }) → PageOf<KnowledgeDoc>
- deleteDoc({ agentId, docId }) → { success }
- indexDoc({ agentId, docId }) → { success }
- stats({ agentId }) → KnowledgeStats
- search({ agentId, query, topK?, filters? }) → SearchResult[]

## Todo
- [ ] 파일 레이아웃/manifest 버전 정의
- [ ] BM25 파라미터/토크나이저 초기값(k1,b,weights)
- [ ] 서비스/스토어/인덱스 인터페이스 확정 및 테스트
- [ ] GUI Knowledge 연동(로컬스토리지 제거)

## Notes
- 추후 벡터 인덱스 옵션으로 확장
- 언어/스톱워드 튜닝은 후속

