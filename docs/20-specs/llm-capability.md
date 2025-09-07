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
