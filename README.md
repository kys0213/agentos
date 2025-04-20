# AgentOS

A modular agent framework built with TypeScript.

## Project Structure

```
.
├── packages/
│   ├── core/          # Agent execution core
│   ├── cli/           # CLI commands
│   ├── gui/           # Electron-based GUI
│   ├── shared/        # Presets, utilities, type definitions
│   ├── llm-bridge/    # LLMClient interface and loader
├── .agent/            # User data (presets, sessions, logs)
├── apps/playground/   # Sandbox application
├── .github/workflows/ # CI/CD
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run development mode
pnpm dev
```

## Development

- `pnpm build` - Build all packages
- `pnpm dev` - Run development mode
- `pnpm lint` - Run linting
- `pnpm format` - Format code with Prettier

## License

MIT