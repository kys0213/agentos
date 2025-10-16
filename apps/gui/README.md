# AgentOS GUI

A desktop GUI built with **Electron** and **React**. It uses the AgentOS core
library to run tasks and provides a friendly interface for managing chat
sessions and presets.

## 🎯 Current Status: Figma Prototype Migration Complete

**Figma-based Modern Implementation (2025-08-03):**

- ✅ **AI Reasoning Mode & Agent Orchestration**: Advanced chat interface
- ✅ **Complete Management System**: Dashboard, Sub-Agents, Models, Presets
- ✅ **shadcn/ui Design System**: Modern component library with 15+ components
- ✅ **Dual Mode Architecture**: Chat ↔ Management seamless transitions
- ✅ **Multi-Environment Support**: Electron, Web, Extension compatibility
- ✅ **Mock-First Development**: Independent from @packages/core

📖 **Migration Details**: [Frontend Implementation Roadmap](docs/frontend/roadmap.md)

## 🎯 Next Development Priorities

**Building on Figma Implementation Foundation**

### 🚀 **Phase 1: Backend Integration**

_Transform mock services to real functionality_

1. **Real API Integration** 🔌 **HIGH**
   - Replace mock services with @packages/core integration
   - Live chat functionality with actual LLM bridges
   - Real preset and model management

2. **Data Persistence** 💾 **HIGH**
   - Chat history storage and retrieval
   - Session state management
   - User preferences persistence

### 🔄 **Phase 2: Advanced Features**

_Expand beyond basic functionality_

3. **Enhanced Chat Experience** 💬 **MEDIUM**
   - Message search and filtering
   - Session organization and renaming
   - Export capabilities

4. **Advanced Management** ⚙️ **MEDIUM**
   - MCP plugin management
   - Advanced model configuration
   - Performance monitoring

### 📊 **Phase 3: Optimization & Polish**

_Performance and user experience refinement_

5. **Performance Optimization** ⚡ **LOW**
   - Virtual scrolling for large conversations
   - Bundle optimization and code splitting
   - Memory usage optimization

6. **Testing & Quality** 🧪 **LOW**
   - E2E test coverage
   - Accessibility improvements
   - Error handling enhancement

## 📁 Component Architecture

**Role-based Component Organization:**

```text
apps/gui/src/renderer/components/
├── layout/
│   └── AppLayoutV2.tsx           # Main dual-mode layout
├── chat/
│   ├── ChatHistory.tsx           # Message display & history
│   └── ChatView.tsx              # AI reasoning interface
├── management/
│   ├── Dashboard.tsx             # Management overview
│   ├── ModelManager.tsx          # LLM model configuration
│   ├── PresetManager.tsx         # Chat preset management
│   ├── SubAgentManager.tsx       # Agent orchestration
│   ├── Sidebar.tsx               # Navigation sidebar
│   └── ManagementView.tsx        # Management container
├── settings/
│   ├── SettingsContainer.tsx     # Settings wrapper
│   ├── LLMSettings.tsx           # LLM configuration
│   └── PresetSettings.tsx        # Preset configuration
├── ui/                           # shadcn/ui components
│   ├── button.tsx, card.tsx      # Core UI primitives
│   ├── dialog.tsx, input.tsx     # Form components
│   ├── avatar.tsx, badge.tsx     # Display components
│   └── README.md                 # Component usage guide
└── root level/
    ├── ColorModeToggle.tsx       # Theme switching
    ├── LlmBridgeManager.tsx      # Bridge selection
    ├── PresetSelector.tsx        # Quick preset switch
    └── SettingsMenu.tsx          # Settings access
```

## 📁 Project Structure

```text
apps/gui/
├── src/
│   ├── main/                     # Electron main process
│   └── renderer/                 # React renderer
├── docs/                         # Migration documentation
├── dist/                         # Build output
├── __mocks__/                    # Test mocks
└── configuration files
```

## 🏗️ Core Architecture

### **Technology Stack**

- **Electron**: Cross-platform desktop application shell
- **React 18**: Modern renderer with concurrent features
- **shadcn/ui**: Modern design system (15+ components)
- **Chakra UI**: Legacy theming system (being migrated)
- **TypeScript**: Full type safety throughout

### **Key Design Patterns**

- **Dual Mode Architecture**: Seamless Chat ↔ Management transitions
- **Mock-First Development**: Independent from backend dependencies
- **Component Composition**: Highly reusable, focused components
- **Type-Safe Communication**: Strict TypeScript across all interfaces

## 🎨 Design System

### **shadcn/ui Components (Primary)**

```tsx
// Modern component usage
import { Button, Card, Input, Avatar } from './ui';

<Card>
  <Button variant="outline">Action</Button>
  <Input placeholder="Type here..." />
</Card>;
```

### **Styling Architecture**

- **shadcn/ui**: Primary component system with Tailwind CSS
- **Chakra UI**: Legacy system (gradual migration)
- **Theme Support**: Light/dark mode via `ColorModeToggle`
- **Responsive Design**: Mobile-first approach with breakpoints
- **Type Safety**: Full TypeScript integration

### **Component Guidelines**

1. **Prefer shadcn/ui** for new features
2. **Maintain consistency** with existing patterns
3. **Use composition** over inheritance
4. **Follow accessibility** standards
5. **Implement responsive** design patterns

### 🔑 **UX Principles**

- **Dual Mode Flow**: Seamless Chat ↔ Management transitions
- **Context Preservation**: No data loss during navigation
- **Progressive Disclosure**: Advanced features discoverable but not intrusive
- **Predictive Interface**: AI-powered suggestions and automation

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
