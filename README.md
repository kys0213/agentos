# AgentOS

A modular agent framework built with TypeScript. This repository is a **pnpm**
workspace containing several packages that together provide a flexible
foundation for building agents.

## Project Structure

```
packages/
├── core/                # agent interfaces and file‑based implementations
├── cli/                 # command line interface (work in progress)
├── gui/                 # Electron + React GUI (work in progress)
├── llm-bridge-runner/   # runtime loader for LLM bridges
└── agent-slack-bot/     # Slack bot using Bolt

apps/
├── cli/                 # command line interface
├── gui/                 # Electron + React GUI
└── agent-slack-bot/     # Slack bot application
```

Additional design documents for each package live under `packages/<name>/docs`.


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
