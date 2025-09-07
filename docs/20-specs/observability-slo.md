# Observability & SLO (Directional Draft)

> 상태: 방향성 초안. 지표/목표치/알람은 조직별로 달라질 수 있으며, 본 문서는 가이드를 제시합니다.

## 메트릭 정의(핵심)

- requests_total{agentId, route, model}
- tokens_in_total / tokens_out_total
- latency_ms{p50,p95}
- cost_usd_total
- success_rate (1 - error_rate)
- rerank_applied_total
- cache_hit_ratio (knowledge/memory)

## 트레이싱

- 스팬 이름: agentos.router, agentos.llm.call, agentos.tool.call, agentos.storage.query
- 태그: agentId, sessionId, model, route, cost_usd, tokens_in, tokens_out, retry_count

## 대시보드 레이아웃(예시)

- L1: 전체 요청수/성공률/비용/지연 P50/P95
- L2: 모델별 비용·지연, 라우트별 성공률, 캐시 히트율
- L3: 에러 Top-K(코드/도메인), 리랭크 영향(품질 프록시)

## SLO(예시)

- P95 지연 ≤ 4s (월 99%)
- 에러율 ≤ 2% (월 99%)
- 비용/1000요청 ≤ $X (조직 기준)

## 알람 룰(예시)

- P95 지연 > 2x 베이스라인 5분 지속 → 경고
- 에러율 > 5% 5분 지속 → 경고, > 10% 5분 지속 → 심각
- 비용 급증(3표준편차 초과) → 경고
