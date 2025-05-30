# Interface Specifications

Key interfaces reside in `packages/core`.

- **Agent** — `src/agent/agent.ts` defines the `run()` method which receives user messages and returns updated message history.
- **ChatSession** — `src/chat/chat-session.ts` manages message history and usage information.
- **Mcp** — `src/mcp/mcp.ts` communicates with Model Context Protocol servers.

Implementations can extend these interfaces or provide new ones that conform to the same contracts.
