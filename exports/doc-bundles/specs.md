# AgentOS Docs — Specs Bundle

> Generated on 2025-10-17T01:05:07.346Z


---

## Source Directory: docs/20-specs

### File: docs/20-specs/batch-collection.md

<!-- Source: docs/20-specs/batch-collection.md -->

# Batch Collection Spec (Directional Draft)

> 상태: 방향성 초안. 실제 레코드/파일 구조/전송 규칙은 구현 과정에서 단순화/변경될 수 있습니다.

본 문서는 “로컬 퍼스트 + 동의 기반 배치 수집”을 구현하기 위한 수집기 설계 방향을 제시합니다. 핵심 원칙은 앱 프로세스(GUI/CLI/Bot)와 수집기의 실행 프로세스를 분리해 안정성·보안·성능을 동시에 확보하는 것입니다.

## 디렉토리 구조

```
~/.agentos/
  journal/            # append-only JSONL, 도메인별 폴더
    interactions/  usage/  errors/  tools/
  outbox/             # 전송 대기 배치(압축 가능)
  state/              # 커서/ACK 상태
  redaction.yaml      # 마스킹 규칙
  collector.yaml      # 구성 파일
```

## Shaper(정규화/마스킹)

입력: 앱이 기록한 로컬 이벤트(파일 append 또는 IPC) → 스키마 정규화 → PII 탐지/마스킹(allowlist+패턴) → JSONL 롤링

레코드 공통 필드(예시):

```json
{
  "timestamp": "2025-09-06T10:00:00Z",
  "correlation_id": "corr_...",
  "session_id": "s_...",
  "agent_id": "a_...",
  "route": "qa|summarize|...",
  "model": "gpt-4o-mini",
  "redaction_applied": ["email"],
  "consent": { "opted_in": true, "scope": "meta_only|anonymized|full_denied" }
}
```

## Transmitter(배치/전송)

- 스케줄: cron 표현식(예: 매 15분) + 백오프(지수+지터)
- 전송: HTTPS + 인증(API Key/JWT), 압축 + 청크 업로드
- 멱등: `idempotency_key=hash(batch)` 전송, 서버 ACK `{ack_id, accepted, rejected}` 후 outbox 커밋
- 재시도: 네트워크/5xx 시 재시도, 4xx는 보류/격리

## 실행 모드

- Sidecar: 시스템 서비스/컨테이너로 상시 실행(권장)
- Child: 앱이 필요 시 스폰, IPC로 신호만 교환(수집 분리)
- Batch: cron/scheduler 주기 실행(도입 용이)

## 구성 파일 예시(아이디어)

```yaml
collector:
  mode: sidecar
  schedule: '*/15 * * * *'
  journal_dir: ~/.agentos/journal
  outbox_dir: ~/.agentos/outbox
  max_batch_bytes: 5242880
  endpoint:
    base_url: https://collector.example.com
    auth:
      type: api_key
      api_key_env: AGENTOS_COLLECTOR_TOKEN
  tls:
    verify: true
  privacy:
    consent_required: true
    scope: anonymized
    redaction_rules: ~/.agentos/redaction.yaml
```

## 장애/복구 시나리오

- 네트워크 다운: outbox에 배치 보관 → 백오프로 재시도
- 파일 손상: 해시 검증 실패 시 격리 폴더로 이동, 다음 배치 진행
- 서버 409(IdempotencyKeyInUse): 동일 응답 처리 후 커밋(중복 업로드 방지)

## 보안/프라이버시

- 전송 TLS, at-rest 암호화 옵션
- 최소 수집 원칙(allowlist), 본문 기본 비수집(meta_only)
- 민감 필드는 마스킹 규칙 필수 적용

### File: docs/20-specs/collector-ingest-api.md

<!-- Source: docs/20-specs/collector-ingest-api.md -->

# Collector Ingest API (Directional Draft)

> 상태: 방향성 초안. 실제 엔드포인트/페이로드/오류 코드는 구현 과정에서 단순화/변경될 수 있습니다.

## 목표

- 배치 수집기(로컬/사이드카)가 주기적으로 안전하게 데이터를 업로드
- 멱등/재시도/백오프를 지원하여 네트워크/서버 장애에도 안전
- 프라이버시(allowlist/redaction)와 보안(TLS/인증)을 전제

## 최소 엔드포인트 아이디어

- POST `/v1/collect`
  - 헤더: `Authorization: Bearer <token>` 또는 `X-API-Key: <key>`
  - 헤더: `Idempotency-Key: <hash(batch)>`
  - 본문(아이디어):
    ```json
    {
      "batch_id": "2025-09-06-001",
      "journal": {
        "interactions": [
          /* 요약 메시지(메타/익명화) */
        ],
        "usage": [
          /* tokens/latency/cost */
        ],
        "errors": [
          /* code/message/domain */
        ],
        "tools": [
          /* tool call meta */
        ],
        "events": [
          /* 상태 이벤트(옵션) */
        ]
      },
      "cursor": { "events_after": "evt_123" },
      "meta": { "source": "gui|cli|slackbot", "client": "agentos-collector/0.1" }
    }
    ```
  - 응답(아이디어):
    ```json
    { "ack_id": "ACK-2025-09-06-001", "accepted": 1234, "rejected": 0 }
    ```

## 멱등/재시도

- 동일 `Idempotency-Key`로 재전송 시 서버는 이전 결과를 재사용(멱등) 또는 `409 Conflict`
- 5xx/네트워크 오류 시 지수 백오프 + 지터 재시도, 4xx는 보류/격리

## 보안/프라이버시

- TLS 필수, 토큰/키는 최소 권한 스코프
- 수집 전 로컬에서 allowlist/redaction 적용(본문은 meta_only/anonymized 기본)

## Open Questions

- 개별 도메인(usage/errors 등) 전용 엔드포인트로 나눌지? 단일 엔드포인트 유지?
- batch 크기/청크 업로드 기준은? (5MB/10MB 등)
- 서버 측 보관 수명/압축/색인 전략은?

### File: docs/20-specs/ipc-event-spec.md

<!-- Source: docs/20-specs/ipc-event-spec.md -->

# IPC Event Spec (Electron/Main ↔ Renderer)

본 문서는 Agent/Session 관련 표준 이벤트 채널과 페이로드 스펙을 정의합니다. 코어는 Electron에 직접 의존하지 않으며, 퍼블리셔 인터페이스를 통해 이벤트를 전달합니다.

## 채널 네임스페이스

- `agent/status` — 에이전트 상태 변경
- `agent/change` — 에이전트 메타데이터 갱신(diff/patch)
- `agent/session/created` — 세션 생성됨
- `agent/session/ended` — 세션 종료됨
- `agent/session/<sessionId>/status` — 세션 상태 변경(idle/running/waiting-input/terminated/error)
- `agent/session/<sessionId>/message` — 세션 메시지 추가(user/assistant/tool)
- `agent/session/<sessionId>/error` — 세션 에러
- `agent/session/<sessionId>/promptRequest` — 사용자 프롬프트 입력 요청
- `agent/session/<sessionId>/consentRequest` — 사용자 동의 요청
- `agent/session/<sessionId>/sensitiveInputRequest` — 민감정보 입력 요청

각 채널은 `agentId`를 포함한 페이로드를 전달합니다.

## 페이로드 스키마 개요

- `agent/status`
  - `{ agentId: string; status: 'active'|'idle'|'inactive'|'error' }`
- `agent/change`
  - `{ agentId: string; patch: Partial<AgentMetadata> }`
- `agent/session/created`
  - `{ agentId: string; sessionId: string }`
- `agent/session/ended`
  - `{ agentId: string; sessionId: string; reason?: string }`
- `agent/session/<sid>/status`
  - `{ agentId: string; sessionId: string; state: 'idle'|'running'|'waiting-input'|'terminated'|'error'; detail?: string }`
- `agent/session/<sid>/message`
  - `{ agentId: string; sessionId: string; message: MessageHistory }`
- `agent/session/<sid>/error`
  - `{ agentId: string; sessionId: string; error: { message: string; code?: string; domain?: string } }`
- `agent/session/<sid>/promptRequest`
  - `{ agentId: string; sessionId: string; id: string; message: string; schema?: unknown }`
- `agent/session/<sid>/consentRequest`
  - `{ agentId: string; sessionId: string; id: string; reason: string; data?: unknown }`
- `agent/session/<sid>/sensitiveInputRequest`
  - `{ agentId: string; sessionId: string; id: string; fields: Array<{ key: string; label: string; secret?: boolean }>} `

참고 타입: `AgentMetadata`, `MessageHistory`는 `@agentos/core`에서 export 됩니다.

## 동작 가이드

- 메인 프로세스는 코어의 브리지(이벤트 브로드캐스터)를 사용해 이벤트를 퍼블리시하고, 렌더러는 IPC로 구독합니다.
- 토큰 스트리밍 등 고빈도 이벤트는 배치/샘플링 적용을 권장합니다.
- 에러 페이로드는 `CoreError`의 `code/domain/message`를 반영할 수 있습니다(선택).

## 어댑터 예시 (Electron Main 등)

```ts
import { AgentEventBridge, FunctionPublisher } from '@agentos/core';

// 예시: Electron webContents에 연결 (core는 electron에 의존하지 않습니다)
function wireAgentBridge(agentManager, webContents) {
  const publisher = new FunctionPublisher(
    (channel, payload) => webContents.send(channel, payload),
    {
      channelPrefix: 'agentos:',
    }
  );
  const bridge = new AgentEventBridge(agentManager, publisher);
  bridge.attachAll();
  return bridge;
}

// 여러 대상에 브로드캐스트
import { CompositePublisher } from '@agentos/core';
function wireBroadcast(agentManager, windows /* () => BrowserWindow[] */) {
  const pubs = windows().map(
    (w) =>
      new FunctionPublisher((ch, data) => w.webContents.send(ch, data), {
        channelPrefix: 'agentos:',
      })
  );
  const bridge = new AgentEventBridge(agentManager, new CompositePublisher(pubs));
  bridge.attachAll();
  return bridge;
}
```

## 렌더러 구독 예시 (범용)

```ts
import {
  FunctionSubscriber,
  subscribeJson,
  isAgentStatusPayload,
  isAgentChangePayload,
  isSessionStatusPayload,
  isSessionMessagePayload,
} from '@agentos/core';

// Electron의 ipcRenderer.on을 감싼 예시(앱 레이어에서 구현)
const subscriber = new FunctionSubscriber((channel, handler) => {
  const off = (event, payload) => handler(payload);
  ipcRenderer.on(`agentos:${channel}`, off);
  return () => ipcRenderer.off(`agentos:${channel}`, off);
});

subscribeJson(subscriber, 'agent/status', isAgentStatusPayload, (p) => {
  // update UI store with p.agentId and p.status
});

subscribeJson(subscriber, 'agent/change', isAgentChangePayload, (p) => {
  // apply metadata patch
});

subscribeJson(subscriber, 'agent/session/123/status', isSessionStatusPayload, (p) => {
  // reflect session status
});

subscribeJson(subscriber, 'agent/session/123/message', isSessionMessagePayload, (p) => {
  // append message
});
```

### File: docs/20-specs/llm-capability.md

<!-- Source: docs/20-specs/llm-capability.md -->

# LLM Capability Spec (Directional Draft)

> 상태: 아이디어/방향성 초안입니다. 실제 스키마/필드는 구현 과정에서 변경될 수 있습니다. 아래 내용은 참고용 제안이며, 합의 전까지 비규범(non‑normative)입니다.

본 문서는 브리지(모델) 기능/제약/비용/지연 정보를 선언적으로 기술하기 위한 방향을 제시합니다. 목적은 오케스트레이터가 비용/지연/품질/정책 적합도 기반 라우팅 및 폴백 결정을 자동화할 수 있도록 표준화된 메타데이터를 제공하는 것입니다.

## 방향성 요약

- 공통 필드(맥락 길이/토크나이저/지원 기능/비용·지연 프로파일)를 가진 단순한 capability 문서
- 라우팅 목표(저비용/저지연/균형/기능필수)에 따라 모델 점수화하여 선택
- 벤더/로컬 모델 간 최소 교집합을 유지하되, 벤더별 확장 필드는 확장 슬롯로 수용

## (참고) 예시 스키마 스케치

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agentos.dev/schemas/llm-capability.json",
  "type": "object",
  "required": [
    "id",
    "family",
    "max_context",
    "tokenizer",
    "modes",
    "cost_profile",
    "latency_profile"
  ],
  "properties": {
    "id": { "type": "string", "description": "unique model id (bridge specific)" },
    "family": {
      "type": "string",
      "enum": ["openai", "anthropic", "local", "vertex", "azureopenai", "other"]
    },
    "display_name": { "type": "string" },
    "version": { "type": "string" },
    "region": { "type": "string", "description": "hosting region (if applicable)" },
    "compliance": {
      "type": "array",
      "items": { "type": "string" },
      "description": "e.g., HIPAA, SOC2"
    },
    "max_context": { "type": "integer", "minimum": 1024 },
    "tokenizer": { "type": "string", "enum": ["tiktoken", "anthropic", "sentencepiece", "other"] },
    "supports": {
      "type": "object",
      "properties": {
        "function_calling": { "type": "boolean" },
        "json_mode": { "type": "boolean" },
        "system_prompt": { "type": "boolean" },
        "stream": { "type": "boolean" },
        "parallel_tools": { "type": "boolean" },
        "vision": { "type": "boolean" },
        "audio": { "type": "boolean" }
      },
      "additionalProperties": false
    },
    "modes": {
      "type": "array",
      "items": { "type": "string", "enum": ["chat", "completion", "tool", "embed"] }
    },
    "cost_profile": {
      "type": "object",
      "required": ["currency", "input_per_1k", "output_per_1k"],
      "properties": {
        "currency": { "type": "string", "enum": ["USD", "KRW", "EUR", "JPY", "other"] },
        "input_per_1k": { "type": "number", "minimum": 0 },
        "output_per_1k": { "type": "number", "minimum": 0 },
        "embed_per_1k": { "type": "number" }
      }
    },
    "latency_profile": {
      "type": "object",
      "properties": {
        "p50_ms": { "type": "integer", "minimum": 0 },
        "p95_ms": { "type": "integer", "minimum": 0 }
      },
      "additionalProperties": false
    },
    "rate_limits": {
      "type": "object",
      "properties": {
        "rpm": { "type": "integer" },
        "tpm": { "type": "integer" }
      },
      "additionalProperties": false
    },
    "limits": {
      "type": "object",
      "properties": {
        "max_tools": { "type": "integer" },
        "max_output_tokens": { "type": "integer" }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

## (참고) 타입 스케치(소비측)

```ts
export interface LlmCapability {
  id: string;
  family: 'openai' | 'anthropic' | 'local' | 'vertex' | 'azureopenai' | 'other';
  display_name?: string;
  version?: string;
  region?: string;
  compliance?: string[];
  max_context: number;
  tokenizer: 'tiktoken' | 'anthropic' | 'sentencepiece' | 'other';
  supports?: {
    function_calling?: boolean;
    json_mode?: boolean;
    system_prompt?: boolean;
    stream?: boolean;
    parallel_tools?: boolean;
    vision?: boolean;
    audio?: boolean;
  };
  modes: Array<'chat' | 'completion' | 'tool' | 'embed'>;
  cost_profile: {
    currency: string;
    input_per_1k: number;
    output_per_1k: number;
    embed_per_1k?: number;
  };
  latency_profile: { p50_ms?: number; p95_ms?: number };
  rate_limits?: { rpm?: number; tpm?: number };
  limits?: { max_tools?: number; max_output_tokens?: number };
}
```

## 예시 (비규범)

OpenAI GPT-4o mini:

```json
{
  "id": "gpt-4o-mini",
  "family": "openai",
  "display_name": "GPT‑4o mini",
  "max_context": 128000,
  "tokenizer": "tiktoken",
  "supports": {
    "function_calling": true,
    "json_mode": true,
    "system_prompt": true,
    "stream": true
  },
  "modes": ["chat", "completion", "tool"],
  "cost_profile": { "currency": "USD", "input_per_1k": 0.15, "output_per_1k": 0.6 },
  "latency_profile": { "p50_ms": 800, "p95_ms": 3000 },
  "rate_limits": { "rpm": 3000, "tpm": 200000 }
}
```

Anthropic Claude 3.5 Sonnet:

```json
{
  "id": "claude-3-5-sonnet",
  "family": "anthropic",
  "display_name": "Claude 3.5 Sonnet",
  "max_context": 200000,
  "tokenizer": "anthropic",
  "supports": {
    "function_calling": true,
    "json_mode": true,
    "system_prompt": true,
    "stream": true
  },
  "modes": ["chat", "tool"],
  "cost_profile": { "currency": "USD", "input_per_1k": 3.0, "output_per_1k": 15.0 },
  "latency_profile": { "p50_ms": 1200, "p95_ms": 4000 }
}
```

로컬 LLM (GPU)

```json
{
  "id": "local-qwen2.5-7b-instruct",
  "family": "local",
  "display_name": "Qwen2.5 7B Instruct (GPU)",
  "max_context": 32768,
  "tokenizer": "sentencepiece",
  "supports": {
    "function_calling": false,
    "json_mode": false,
    "system_prompt": true,
    "stream": true
  },
  "modes": ["chat", "completion"],
  "cost_profile": { "currency": "USD", "input_per_1k": 0.0, "output_per_1k": 0.0 },
  "latency_profile": { "p50_ms": 500, "p95_ms": 2000 }
}
```

## 라우팅 아이디어(예시)

```ts
interface RoutingPolicy {
  objective: 'low_cost' | 'low_latency' | 'balanced' | 'capability_required';
  require?: Partial<LlmCapability['supports']> & { modes?: LlmCapability['modes'] };
  hard_limits?: { max_cost_usd?: number; max_latency_ms?: number };
}

function score(cap: LlmCapability, p: RoutingPolicy): number {
  // normalize cost per 1k output tokens and p95 latency
  const cost = cap.cost_profile.output_per_1k;
  const p95 = cap.latency_profile.p95_ms ?? 3000;
  const hasReq = (() => {
    if (!p.require) return true;
    if (p.require.modes && !p.require.modes.every((m) => cap.modes.includes(m))) return false;
    const s = p.require as any;
    if (s.function_calling && !cap.supports?.function_calling) return false;
    if (s.json_mode && !cap.supports?.json_mode) return false;
    return true;
  })();
  if (!hasReq) return -Infinity;
  if (p.hard_limits?.max_cost_usd && cost > p.hard_limits.max_cost_usd) return -Infinity;
  if (p.hard_limits?.max_latency_ms && p95 > p.hard_limits.max_latency_ms) return -Infinity;
  switch (p.objective) {
    case 'low_cost':
      return -cost * 10 - p95 / 1000;
    case 'low_latency':
      return -p95 - cost;
    case 'balanced':
      return -(cost * 3 + p95 / 2);
    case 'capability_required':
      return -(cost + p95 / 1000);
  }
}
```

위 점수 함수는 예시입니다. 실제 정책/가중치는 도메인/비용 계약에 맞게 조정하며, 최종 스펙은 합의 후 확정합니다.

## Open Questions

- 기능 플래그 세분도(예: JSON 모드/함수호출의 버전 차이)를 어디까지 표준화할지?
- 비용/지연 값의 갱신 주기/출처(벤더 vs 관측 데이터) 병합 정책은?
- 지역/컴플라이언스(PII/데이터 경계) 수준의 라우팅 제약 표현 방안은?

### File: docs/20-specs/observability-slo.md

<!-- Source: docs/20-specs/observability-slo.md -->

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

### File: docs/20-specs/privacy-security.md

<!-- Source: docs/20-specs/privacy-security.md -->

# Privacy & Security Policy (Directional Draft)

> 상태: 방향성 초안. 실제 기본값/정책 항목은 운영 요구사항에 따라 조정될 수 있습니다.

로컬 퍼스트 + 배치 수집 원칙 하에서 개인정보/보안을 보장하기 위한 정책 방향을 제시합니다.

## 동의 모델(Consent)

- 기본값: 수집 비활성화(opt-out). 명시적 옵트인 시에만 전송
- 범위(scope): `meta_only | anonymized | full_denied`
  - meta_only: 토큰 수/지연/오류/라우팅 등 메타만 수집, 본문 금지
  - anonymized: 본문에서 PII 제거/치환 후 수집(허용목록 기반)
  - full_denied: 어떤 본문도 외부 전송 금지(로컬에만 보관)

## 허용목록/마스킹 규칙(YAML 예시)

```yaml
privacy:
  mode: anonymized
  allowlist:
    - session_id
    - agent_id
    - route
    - model
    - tokens_in
    - tokens_out
    - latency_ms
    - error_code
  redaction:
    patterns:
      - name: email
        regex: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
        replace: "<EMAIL>"
      - name: phone
        regex: "\+?[0-9][0-9\- ]{7,}"
        replace: "<PHONE>"
```

## 보존/권리

- 보존 기간: 메타 180일, 익명화 본문 90일(예시). 만료 후 자동 삭제
- 삭제/정정 요청: 로컬/중앙 각각 지원. 수집 식별자(ack_id/batch_id) 기준 삭제

## 암호화/비밀 관리

- 전송: TLS 1.2+ 필수. HSTS 권장
- 저장: 로컬 at-rest 암호화(키체인/OS 보안 스토리지 연동 옵션)
- 시크릿: 앱/수집기/서버에서 Secret Vault 연동(환경변수 최소화)

## 도구 권한 모델(MCP/Tool)

- RBAC: 역할/스코프 기반 권한(파일/네트워크/OS 호출 제한)
- 위험 툴 require-approval(휴먼 루프): 고위험 작업은 RACP 승인 경로 필수

## 프롬프트 주입 방어

- 시스템/툴 정책 분리, 신뢰도 라벨링(출처/컨텍스트 표시)
- 컨텍스트 최소화/출처 소개, 모델에 금칙(시스템) 주입
- 외부 문서 삽입 시 sanitize(스크립트/마크다운 위험 패턴 정리)

### File: docs/20-specs/racp-spec.md

<!-- Source: docs/20-specs/racp-spec.md -->

# RACP (Remote Agent Command Protocol) Spec (Directional Draft)

> 상태: 아이디어/방향성 초안입니다. 실제 페이로드/엔드포인트/시맨틱은 변경될 수 있습니다. 아래 예시는 합의 전까지 비규범입니다.

원격에서 에이전트 실행을 제어하기 위한 최소 프로토콜을 제안합니다. 목표는 “명령/승인/상태/감사”를 표준화하여 운영 자동화와 감사 가능성을 확보하는 것입니다.

## 리소스 개요

- Command: 실행 요청(Execute/Pause/Cancel)
- Approval: 권한/승인(ACL/멀티사인)
- Status: Heartbeat/Progress/Result 스트림
- Audit: 불변 로그(누가/언제/무엇을/결과)

## 공통 필드(예시)

```json
{
  "id": "cmd_01HXXX...",
  "created_at": "2025-09-06T10:00:00Z",
  "idempotency_key": "c6b2a...",
  "tenant_id": "org_abc",
  "actor": { "type": "user|agent", "id": "u_123" }
}
```

## Command(예시)

```json
{
  "type": "execute|pause|cancel",
  "target": { "agent_id": "a_123", "session_id": "s_456" },
  "priority": 0,
  "timeout_ms": 60000,
  "payload": {
    "messages": [
      /* llm-bridge-spec UserMessage[] */
    ],
    "tools": [
      /* optional tool call allowances */
    ]
  }
}
```

제약: 동일 `idempotency_key` 재접수 시 서버는 동일 응답(멱등) 또는 409(IdempotencyKeyInUse)를 반환.

## Approval(예시)

```json
{
  "command_id": "cmd_...",
  "required": 1,
  "grants": [{ "by": "u_777", "at": "2025-09-06T10:01:00Z", "method": "acl|signature" }]
}
```

승인이 필요한 명령은 `required > grants.length` 동안 `pending_approval` 상태로 유지.

## Status Events(예시)

```json
{ "event": "heartbeat", "command_id": "cmd_...", "agent_id": "a_123", "at": "..." }
{ "event": "progress", "command_id": "cmd_...", "stage": "retrieval|tool|chat", "percent": 42 }
{ "event": "result", "command_id": "cmd_...", "ok": true, "output": { /* chat result */ } }
{ "event": "error", "command_id": "cmd_...", "code": "Timeout", "message": "..." }
```

전달 방식: SSE/WS/Queue 중 하나 선택. 최소 보장은 폴링 `GET /commands/:id/status?since=<cursor>`.

## Audit Log(예시)

```json
{
  "id": "aud_...",
  "command_id": "cmd_...",
  "at": "2025-09-06T10:01:02Z",
  "who": { "id": "u_777", "role": "approver" },
  "action": "approve|reject|enqueue|start|complete|error",
  "meta": { "ip": "...", "user_agent": "..." }
}
```

저장은 append-only. 불변성 보장을 위해 해시 체인(선택) 또는 WORM 스토리지 권장.

## 오류 코드 아이디어(예시)

- Unauthorized, Forbidden, ApprovalRequired
- InvalidPayload, UnsupportedCapability
- RateLimited, QuotaExceeded
- Timeout, Canceled, Conflict(IdempotencyKeyInUse)
- InternalError, UpstreamError

## 시퀀스 아이디어(예시)

```
Client -> ControlPlane : POST /commands {execute}
ControlPlane -> Approver(s) : approval request (async)
Approver -> ControlPlane : approve
ControlPlane -> Agent : enqueue/dispatch
Agent -> ControlPlane : heartbeat/progress/result
ControlPlane -> Client : stream status or GET /commands/:id/status
```

## 보안/신뢰성(가이드 제안)

- 모든 엔드포인트는 OIDC/JWT/API Key 중 택일 인증 + 테넌트 스코프
- 멱등키 필수(최소 execute에 대해), 재시도 안전
- 감사 로그 필수, 민감 메타는 최소 수집

### File: docs/20-specs/README.md

<!-- Source: docs/20-specs/README.md -->

# Specs & Contracts (Overview)

- Batch Collection Spec: `./batch-collection.md`
- IPC/Event Spec: `./ipc-event-spec.md`
- (추가 예정) LLM Capability Spec: `./llm-capability.md`
- (추가 예정) RACP Spec: `./racp-spec.md`
- (추가 예정) Storage Abstraction: `./storage-abstraction.md`
- (추가 예정) Privacy & Security: `./privacy-security.md`
- (추가 예정) Observability & SLO: `./observability-slo.md`
- (방향성) Collector Ingest API: `./collector-ingest-api.md`

이 섹션은 스펙/계약의 단일 진입점입니다.

### File: docs/20-specs/storage-abstraction.md

<!-- Source: docs/20-specs/storage-abstraction.md -->

# Storage Abstraction Spec (Directional Draft)

> 상태: 방향성 초안. 아래 인터페이스/규약은 스케치이며, 구현 과정에서 단순화/변경될 수 있습니다.

## TypeScript 인터페이스(스케치)

```ts
export interface Cursor {
  after?: string;
  limit?: number;
}
export interface Page<T> {
  items: T[];
  next?: string;
}

export interface SessionSummary {
  id: string;
  agentId: string;
  updatedAt: string;
  title?: string;
  status?: string;
}
export interface MessageRecord {
  sessionId: string;
  ts: string;
  role: 'user' | 'assistant' | 'tool';
  content: unknown;
}

export interface SessionStore {
  create(
    agentId: string,
    opts?: { sessionId?: string; presetId?: string }
  ): Promise<{ id: string }>;
  get(id: string): Promise<SessionSummary | null>;
  list(filter?: { agentId?: string }, cursor?: Cursor): Promise<Page<SessionSummary>>;
  appendMessages(sessionId: string, msgs: MessageRecord[]): Promise<void>;
  history(sessionId: string, cursor?: Cursor): Promise<Page<MessageRecord>>;
  terminate(sessionId: string): Promise<void>;
}

export interface MemoryNode {
  id: string;
  kind: 'short' | 'long' | 'agent';
  text: string;
  score?: number;
  meta?: any;
}
export interface MemoryStore {
  upsert(nodes: MemoryNode[]): Promise<void>;
  search(query: string, k: number, opts?: { agentId?: string }): Promise<MemoryNode[]>;
  evict(policy: { maxNodes?: number }): Promise<number>;
}

export interface KnowledgeDoc {
  id: string;
  text: string;
  embedding?: number[];
  meta?: any;
}
export interface KnowledgeIndex {
  add(docs: KnowledgeDoc[]): Promise<void>;
  query(
    q: string,
    k: number,
    opts?: { hybrid?: boolean }
  ): Promise<Array<{ id: string; score: number }>>;
}

export interface UsageRecord {
  ts: string;
  agentId: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd?: number;
  latencyMs?: number;
}
export interface UsageStore {
  add(records: UsageRecord[]): Promise<void>;
  aggregate(range: { from: string; to: string }, by: 'day' | 'agent' | 'model'): Promise<any>;
}

export interface EventRecord {
  id: string;
  ts: string;
  type: string;
  payload: any;
}
export interface EventStore {
  append(events: EventRecord[]): Promise<void>;
  tail(cursor?: Cursor): Promise<Page<EventRecord>>;
}
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
  "payload": {
    "events": [
      /* EventRecord[] */
    ]
  },
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

_Included files: 9_