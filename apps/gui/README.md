# AgentOS GUI

A desktop GUI built with **Electron** and **React**. It uses the AgentOS core
library to run tasks and provides a friendly interface for managing chat
sessions and presets.

## Folder Structure

```text
apps/gui
├── src/            # main and renderer processes
├── dist/           # compiled output
├── docs/           # design documents
├── __mocks__/      # test mocks
├── jest.config.js  # Jest configuration
├── package.json    # npm metadata
├── tsconfig.json   # TypeScript configuration
└── Dockerfile      # container build
```

## Core Concepts

- **Electron** hosts the application shell.
- **React** powers the renderer with Chakra UI for components and theming.
- The GUI communicates with the `@agentos/core` package to execute tasks.

## Styling Guide

The GUI follows these styling principles:

- Chakra UI provides the base components and theming.
- The application theme is defined in `src/renderer/theme.ts`.
- Color mode can be toggled from the settings menu via the sun/moon button.
- Use Chakra UI's responsive props (`base`, `md`, etc.) to ensure layouts adapt to window size.
- Prefer Chakra components over raw HTML elements for consistency.
- The `PresetSelector` component uses `Select` with responsive props.
- The bridge selector in `ChatApp` uses `FormControl` and `FormLabel` for better consistency.

## Building and Testing

From the repository root:

```bash
# Install dependencies and build
pnpm --filter @agentos/apps-gui install
pnpm --filter @agentos/apps-gui build

# Run in development mode
pnpm --filter @agentos/apps-gui dev

# Execute tests
pnpm --filter @agentos/apps-gui test
```

## License

MIT
