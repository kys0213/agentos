# BM25 Index Plan (Core)

## Requirements
- 기본 토크나이저/정규화, 스톱워드(옵션)
- k1/b/필드가중치 파라미터 제공
- 증분 인덱싱, 비차단 빌드, 검색 API 제공

## Interface Sketch
- BM25Index.addOrUpdate/remove/search/stats
- manifest: { version, tokenizer, stopwords, lang, k1, b, weights, docCount, lastBuiltAt }
- 파일: postings.bin, docmap.json, vocab.json(옵션)

## Todo
- [ ] 파일 포맷 세부/엔디안/버전 정책
- [ ] 증분 전략/락 정책
- [ ] 스니펫 생성 규칙
- [ ] 단위테스트 케이스 정의

