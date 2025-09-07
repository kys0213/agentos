# Personalized Memory Graphs (Agent + Session)

This guide describes the personalized memory subsystem for AgentOS Core: a session short‑term graph layered over an agent long‑term graph, with canonicalKey merge for exact duplicates and n‑gram hashing embeddings for semantic similarity.

## Goals

- Separate session(short‑term) and agent(long‑term) memory with promotion at session end.
- Exact duplicate merge with canonicalKey; semantic similarity via n‑gram hashing + cosine.
- Feedback learning and decayed ranking with LRU‑style eviction.
- Deterministic snapshot/persistence including embedder/canonical meta.

## Architecture

- GraphStore: in‑memory nodes/edges with fixed edge keys `from::type::to` and ranked eviction.
- Embedding: character n‑gram(3–5) hashing into a fixed dimension(16k) + L2 + cosine.
- canonicalKey: `hash(normalize(text))` with meta `{ normVersion, hashAlgo, seed }`.
- Orchestrator: session‑first writes, hybrid search(session+agent) with canonicalKey de‑dupe, promotion at finalize.

## Key Features

- Upsert: uses canonicalKey for exact duplicates; falls back to embedding thresholds `tauDup`(near‑duplicate) and `tauSim`(similar).
- Search: linear or inverted index(candidate blocking) → cosine ranking; hybrid session+agent merge with session‑first bias.
- Feedback: `recordFeedback(qId, 'up'|'down'|'retry')` and `adjustWeights()` for promotion carry.
- Snapshots: embedding as `[[i,v], ...]`, plus `embedderState` and `canonicalMeta` for reproducibility.

## Configuration Hints

- Session(default): `maxNodes ~ 1000`, `tauDup ~ 0.96`, `enableInvertedIndex: false` initially.
- Agent(default): `maxNodes ~ 1000`, `enableInvertedIndex: true`.
- Ranking half‑life: 240 min(session), 1440 min(agent).
- Protect hub nodes with `protectMinDegree`.

## Acceptance Criteria

- Promotion improves agent search score for repeated/feedback‑boosted queries.
- Snapshot round‑trip preserves top‑k and scores(within epsilon).
- With 1k nodes/4k edges scale, remains within reasonable memory budget.

## Usage (Core API)

- See `memory-api.md` for full types. Typical flow:
  1. Create `MemoryOrchestrator(agentId, cfg)`
  2. `upsertQuery(sessionId, text)` and `recordFeedback(...)`
  3. `search(sessionId, text, k)` to merge session+agent with de‑dupe
  4. `finalizeSession(sessionId, { promote, checkpoint })`

## Snapshot/Checkpoint

- GraphStore: `toSnapshot()/fromSnapshot()/saveToFile()/loadFromFile()`
- Orchestrator checkpoint: `checkpoint.outDir` writes session summaries with embedder/canonical meta

## Notes

- PII: redaction/masking should happen at shipper/filebeat stage before server ingestion.
- Concurrency: single‑process safety with simple serialization (mutex/queue) is recommended for I/O.
