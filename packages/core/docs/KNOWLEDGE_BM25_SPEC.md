# Knowledge BM25 Index Spec (Core)

목표: BM25 기반 텍스트 검색(MVP)

토크나이저/정규화
- 기본: 공백/문장부호 기준 토큰화, lowercasing
- 스톱워드: 언어별 제거(옵션) — manifest.lang: 'auto' | 'en' | 'ko'
- 숫자/기호 제거(옵션)

파라미터
- k1 = 1.5, b = 0.75 (기본)
- 필드 가중치: title=2.0, body=1.0 (manifest에서 조정 가능)

파일 포맷(요약)
- `index/bm25/manifest.json`: { version, tokenizer, stopwords, lang, k1, b, titleWeight, bodyWeight, docCount, lastBuiltAt }
- `index/bm25/postings.bin`: termID→(docId, tf) 리스트의 바이너리 직렬화(엔디안/버전 명시)
- `index/bm25/docmap.json`: { docId: { len, titleLen? } }
- `index/bm25/vocab.json`(선택): term → termID

빌드/증분
- create/update/delete 시 대상만 재인덱싱
- 비차단 빌드(백그라운드 워커), 빌드 종료 시 manifest 갱신

검색
- 입력: query(string), filters: { tags?: string[] }, topK(기본 20)
- 처리: 토크나이즈→BM25 스코어링→상위 N
- 결과: { docId, score, title, snippet }
- 스니펫: 첫 매칭 문장 혹은 윈도우 기반 하이라이트(추후)

제한/주의
- 멀티언어 최적화는 후속(한국어 형태소 등)
- 인덱스 버전 변경 시 전체 재빌드 필요

