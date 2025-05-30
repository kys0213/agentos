# AgentOS

A modular agent framework built with TypeScript. This repository is a **pnpm**
workspace containing several packages that together provide a flexible
foundation for building agents.

## Packages

```
packages/
├── core/                # agent interfaces and file‑based implementations
├── cli/                 # command line interface (work in progress)
├── gui/                 # Electron + React GUI (work in progress)
├── llm-bridge-runner/   # runtime loader for LLM bridges
└── agent-slack-bot/     # Slack bot using Bolt

apps/
└── playground/          # sandbox application
```

### Core

`core` exposes the main abstractions used throughout the project:

- **Agent** – executes tasks with the help of an LLM bridge.
- **ChatSession** and **ChatManager** – handle conversation history and
  storage. Default implementations store everything on the local file system.
- **Mcp** and **McpRegistry** – communicate with Model Context Protocol (MCP)
  servers and manage available tools.
- **Preset** – defines model and tool configurations for a session.

The package intentionally avoids external dependencies beyond Node's built‑in
APIs. If a database, cache or different storage layer is needed, create a new
package that implements the same interfaces (for example
`redis-session-manager`, `mysql-session-manager`, and so on).

### CLI and GUI

The `cli` package provides a small command line application using
[`commander`](https://github.com/tj/commander.js) and
[`chalk`](https://github.com/chalk/chalk`). It currently supports a simple
`agentos run` command.

The `gui` package is an Electron application with a React renderer. It shows a
basic window that can execute a task via the core library. Both packages are
early prototypes and will evolve as the project grows.

### LLM Bridge Runner

`llm-bridge-runner` loads LLM bridge modules at runtime. This allows AgentOS to
work with a variety of model providers without hard dependencies in the core
package.

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in development mode
pnpm dev
```

Additional scripts are available:

- `pnpm lint` – run ESLint
- `pnpm format` – format the codebase with Prettier

## License

MIT
