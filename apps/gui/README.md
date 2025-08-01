# AgentOS GUI

A desktop GUI built with **Electron** and **React**. It uses the AgentOS core
library to run tasks and provides a friendly interface for managing chat
sessions and presets.

## 🎯 Current Status: Modern Frontend Architecture Complete

**Week 1 (2025-08-01) Modernization Completed:**

- ✅ **State Management**: Zustand + React Query (ChatApp.tsx: 230 lines → 21 lines)
- ✅ **Component Architecture**: 12 role-based components (layout/, chat/, settings/, ui/)
- ✅ **CSS Grid Layout**: Absolute chat area protection system
- ✅ **Performance**: Selective subscription + memoization optimizations

📖 **Detailed Status**: [Week 1 Completion Summary](docs/WEEK1_COMPLETION_SUMMARY.md)
📖 **Implementation Guide**: [Frontend Architect](../.claude/agents/frontend-architect.md)

## 🌀 UX Roadmap: Cyclic User Experience Design

**Following designer-ux.md principles: Users are exploration-oriented, not goal-oriented (A⟷B⟷C⟷A pattern)**

### 🚀 **High Priority: Core UX Experience**

_Direct impact on user exploration and context preservation_

1. **[Cyclic UX Redesign](docs/GUI_CYCLIC_UX_REDESIGN_PLAN.md)** 🎯 **CRITICAL**
   - Command Palette system (Cmd+K) - instant access to all features
   - FAB (Floating Action Button) system - contextual quick actions
   - Settings: Modal → Side Panel transition - frictionless configuration
   - **Why**: Enables A⟷B⟷C⟷A exploration pattern, core UX foundation

2. **[Message Search & Navigation](docs/GUI_MESSAGE_SEARCH_PLAN.md)** 🔍 **HIGH**
   - Real-time message filtering and contextual search
   - **Why**: Supports exploration-oriented user behavior, natural discovery

3. **[Session Management](docs/GUI_SESSION_RENAME_PLAN.md)** 📝 **HIGH**
   - Inline session renaming and organization
   - **Why**: Users organize through exploration, not predefined structure

4. **[Preset Enhancement](docs/GUI_PRESET_ENHANCEMENT_PLAN.md)** ⚙️ **HIGH**
   - Real-time preset switching during conversations
   - **Why**: Context preservation during exploration, no workflow interruption

### 🔄 **Medium Priority: Workflow Integration**

_Seamless transitions between different contexts_

5. **[MCP Configuration](docs/GUI_MCP_CONFIG_PLAN.md)** 🔌 **MEDIUM**
   - Unified settings panel integration
   - **Why**: "Make settings unnecessary, not hidden" - smart configuration

6. **[History Integration](docs/GUI_HISTORY_SIDEBAR_PLAN.md)** 📚 **MEDIUM**
   - Contextual bridges between chat ⟷ history ⟷ settings
   - **Why**: Natural context switching, orbital UI pattern

7. **[Bridge Management](docs/GUI_BRIDGE_MANAGEMENT_PLAN.md)** 🌉 **MEDIUM**
   - Predictive LLM switching based on context
   - **Why**: Reduce cognitive load, AI-powered personalization

### 📊 **Lower Priority: Feature Expansion**

_Additional functionality built on solid UX foundation_

- [MCP Management](docs/GUI_MCP_MANAGEMENT_EXPANSION_PLAN.md) - Advanced MCP features
- [Message UI](docs/GUI_MESSAGE_UI_PLAN.md) - Visual enhancements
- [History Export](docs/GUI_HISTORY_EXPORT_PLAN.md) - Data portability
- [Process Separation](docs/GUI_PROCESS_SEPARATION_PLAN.md) - Technical improvements
- [IPC Migration](docs/GUI_RENDERER_UTILS_IPC_MIGRATION_PLAN.md) - Architecture updates

### 🎯 **UX Success Metrics**

**Cyclic Flow Success:**

- Settings access: 3 clicks → 1 click (Cmd+K)
- Context preservation: >95% during transitions
- Chat area protection: 0% invasion (absolute guarantee)

**Exploration Support:**

- User mistake recovery: <2 seconds
- Cross-context information retention: 100%
- Predictive UI accuracy: >80%

**"Make Settings Unnecessary" Goal:**

- Auto-configuration success rate: >70%
- Manual setting adjustments: <30% of actions
- Zero-configuration new user experience: <5 minutes setup

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

### 🔑 **Key UX Principles Applied**

1. **Orbital UI Pattern**: Chat as center, with Settings ← Chat → MCP Status orbiting around
2. **Contextual Bridges**: Smart transitions that remember where user came from
3. **Elastic Interface**: UI adapts to user intent before they explicitly request it
4. **Progressive Disclosure**: Show complexity only when user explores deeper

_For UX design decisions, always use [designer-ux.md](../.claude/agents/designer-ux.md) agent_

---

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
