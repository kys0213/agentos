# AgentOS Roadmap (Draft)

본 문서는 중단기 로드맵을 요약합니다. 세부 스펙은 각 문서(예: 20-specs/batch-collection.md) 참조.

## 원칙
- 모델 아그노스틱, 로컬 퍼스트, 동의 기반 배치 수집
- 계약 우선(스펙 → 구현), 보안/프라이버시 기본값 강화

## 워크스트림
- LLM Capability 스키마 확정 및 라우팅 정책 반영
- Storage 추상화(File/SQLite/HTTP Sync)
- 배치 수집기: @agentos/collector (Sidecar/Child/Batch)
- RACP 제어면 MVP
- Preset Registry(서명/호환성) 초안
- Observability/가드레일(지표/필터/회로차단/레이트리밋)

## 마일스톤 (예시)
- M1 (주 2)
  - BATCH_COLLECTION_SPEC 초안 확정
  - core: JSONL 저널 라이터(옵션) 제공
  - collector: batch runner PoC (파일→전송, 멱등/백오프)
- M2 (주 4)
  - collector: sidecar/child runners, 구성 파일/암호화/ACK
  - GUI: 수집 설정/옵트인 화면, 로그 미리보기·마스킹 시뮬
- M3 (주 6)
  - Capability 라우팅 옵션(비용/지연/기능) + 평가 하니스 v1
  - Storage: SQLite 어댑터 + 증분 동기 스켈레톤
- M4 (주 8)
  - RACP MVP + 감사 로그 + 멱등/재시도 규칙
  - Registry 초안 + 프리셋 배포 UX(기초)

## 수용 기준(샘플)
- 수집기: 24h 오프라인 후 복구·재시도·중복 방지·손상 파일 스킵 가능
- 프라이버시: meta_only 수집 시 본문/민감필드 부재 보증
- 라우팅: 동일 요청 1k 케이스에서 비용 대비 성능 향상 통계 제공
- 테스트: 워크스페이스 통합 테스트 green, 커버리지 유지/상승

---
이 문서는 지속적으로 갱신됩니다. 변경 시 CHANGELOG나 PR 설명에 링크를 남깁니다.
