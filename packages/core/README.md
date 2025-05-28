# AgentOS Core

The **core** package provides the runtime primitives used by other packages in the AgentOS project.  It is written in TypeScript and compiled to JavaScript.

## Folder Structure

```
packages/core
├── src/
│   ├── agent/           # Agent interfaces and default implementation
│   ├── chat/            # Chat session APIs and file based storage
│   ├── common/          # Utilities shared across the core
│   ├── mcp/             # Model Context Protocol (MCP) client wrappers
│   └── preset/          # Preset definition
├── jest.config.js       # Jest configuration for unit tests
├── package.json         # npm package metadata
└── tsconfig.json        # TypeScript configuration
```

## Agents

The `agent` folder defines the basic interface for an agent and a simple implementation:

- **`agent.ts`** – Defines the `Agent` interface which has a single `run()` method.  It receives an array of user messages and returns the updated message list.
- **`simple-agent.ts`** – Implements `Agent`.  It communicates with an LLM through an `LlmBridge`, handles tool calls by using registered MCP tools and stores messages in a `ChatSession`.

## Chat System

The `chat` folder contains types and classes for managing chat sessions.

- **`chat-session.ts`** – Declares the `ChatSession` interface.  It supports appending messages, storing usage, reading history, checkpoints and metadata.
- **`chat-session-metata.ts`** – Metadata structure for a chat session including totals, title and checkpoints.
- **`chat.manager.ts`** – `ChatManager` interface for creating, loading and listing chat sessions.
- **`file` subfolder** – File based implementation of chat storage:
  - `file-based-session-storage.ts` implements reading and writing history files, checkpoints and metadata under a directory.
  - `file-based-chat.manager.ts` uses the storage to create and load sessions.
  - `file-based-chat-session.ts` provides a `ChatSession` that stores messages in memory until committed to disk and supports history compression.
  - Helper files (`file-based-chat-session-message-history-file.ts`, `file-based-chat-session-check-point-file.ts`, `file-based-chat-session-metadata-file.ts`) encapsulate file operations.

## MCP

The `mcp` directory wraps the **Model Context Protocol** client.  Main pieces are:

- **`mcp.ts`** – High level client exposing methods to invoke tools, prompts and resources.  Handles connection management and exposes events.
- **`mcp-config.ts`** – Configuration types describing how to connect to an MCP server (stdio, streamable HTTP, WebSocket or SSE).
- **`mcp-transport.factory.ts`** – Factory that creates the appropriate transport based on `McpConfig`.
- **`mcp-event.ts`** – Events emitted by an `Mcp` instance.
- **`mcp.registery.ts`** – Registry of MCP instances.  Supports registering/unregistering MCPs and looking up tools.

## Common Utilities

Shared helper modules live in `common`:

- **`pagination`** – `cursor-pagination.ts` defines cursor based pagination utilities used by the chat manager.
- **`scheduler`** – `scheduler.ts` is a simple interval scheduler used for idle disconnects of MCPs.
- **`utils`** – Miscellaneous helpers such as JSON parsing (`parseJson.ts`), safe execution wrapper (`safeZone.ts`) and UUID generation (`uuid.ts`).

## Presets

`preset/preset.ts` defines a `Preset` describing system prompts, enabled MCPs and LLM bridge information.  A preset can be attached to a chat session to preconfigure its behaviour.

## Building and Testing

From the repository root:

```bash
pnpm build       # Compile TypeScript
pnpm test        # Run unit tests for this package
```

Use `pnpm dev` for watch mode when developing.
