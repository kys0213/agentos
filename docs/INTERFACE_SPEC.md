# Interface Specifications

Key interfaces reside in `packages/core`.

- `Agent` — `src/agent/agent.ts` defines the `chat()` method, sessions, and metadata access.
- `Chat` — `src/chat` contains Core message/content types and file-based session helpers.
- `MCP` — `src/tool/mcp` contains MCP registry/repository/service and usage tracking.
- `Memory` — `src/memory` contains graph-store and orchestrator for memory operations.

## Routing API (Core Orchestrator)

Public exports are available via `@agentos/core`.

- Types: `RouterQuery`, `RouterOutput`, `AgentRouter`, `RoutingStrategyFn`, `ScoreResult`, `BuildDocFn`.
- Implementations: `CompositeAgentRouter`.
- Strategies (v1): `BM25TextStrategy`, `MentionStrategy`, `KeywordBoostStrategy`, `ToolHintStrategy`, `FileTypeStrategy`.
- Tokenizers: `EnglishSimpleTokenizer` (default), `LlmKeywordTokenizer` (optional via DI).

Usage

```ts
import { CompositeAgentRouter, BM25TextStrategy, MentionStrategy, KeywordBoostStrategy, ToolHintStrategy, FileTypeStrategy, EnglishSimpleTokenizer } from '@agentos/core';

// Construct router with strategy set and DI tokenizer
const router = new CompositeAgentRouter(
  [BM25TextStrategy, MentionStrategy, KeywordBoostStrategy, ToolHintStrategy, FileTypeStrategy],
  { tokenizer: new EnglishSimpleTokenizer() }
);

// Build query
const query: RouterQuery = {
  text: 'sort an array of numbers',
  hints: ['toolsort'],
  content: [],
};

// Route among agents (assumes you have Agent instances)
const { agents, scores } = await router.route(query, candidateAgents, { topK: 3, includeScores: true });
// agents: sorted best → worst
// scores: optional per-agent composite scores and breakdown metadata
```

Notes

- Deterministic order: ties are broken by status → lastUsed → usageCount → name → id.
- Status gating: `active` by default; `idle` requires a matching hint; `inactive`/`error` excluded by default.
- Privacy: strategy metadata should avoid raw user input; provide matched tokens/terms only.

Implementations can extend these interfaces or provide new ones that conform to the same contracts.
