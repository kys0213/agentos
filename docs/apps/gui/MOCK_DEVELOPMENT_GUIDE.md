# Mock Development Guide

This guide explains how to use mock services for AgentOS GUI development without requiring the backend Electron/RPC infrastructure.

## Quick Start

```bash
# From the GUI directory
cd apps/gui
pnpm dev:web
```

This will start the Vite development server at `http://localhost:5173` with mock RPC services enabled.

## How It Works

### 1. Automatic Detection

The application automatically detects when running in web development mode:

```typescript
// src/renderer/main.ts
if (process.env.NODE_ENV === 'development' && !window.electronAPI) {
  // Runs with mock RPC services
}
```

### 2. Mock RPC Transport

The `MockRpcTransport` class (`src/renderer/rpc/mock-rpc-transport.ts`) provides:

- Simulated RPC communication
- Mock data for all services
- Configurable response delays
- Type-safe responses matching contracts

### 3. Available Mock Services

#### Agent Service

- `agent.get-all-metadatas` - Returns list of mock agents
- `agent.get-metadata` - Returns single agent details
- `agent.create` - Creates new agent (in-memory)
- `agent.update` - Updates agent data
- `agent.delete` - Marks agent as deleted
- `agent.chat` - Returns mock chat response
- `agent.end-session` - Ends chat session

#### Preset Service

- `preset.list` - Returns available presets (사용자 UI에서는 노출되지 않지만 템플릿/Export 용도로 사용)
- `preset.get` - Returns preset details
- `preset.create` - Creates new preset
- `preset.update` - Updates preset
- `preset.delete` - Deletes preset

#### Chat Service

- `chat.list-sessions` - Returns chat sessions
- `chat.get-messages` - Returns messages for a session
- `chat.delete-session` - Deletes a session

#### Other Services

- `bridge.list` - Returns available LLM bridges
- `mcp.list-servers` - Returns MCP servers
- `model.list` - Returns available models

## Customizing Mock Data

To modify mock responses, edit `src/renderer/rpc/mock-rpc-transport.ts`:

```typescript
// Example: Add a new agent
this.handlers.set('agent.get-all-metadatas', async () => {
  return [
    {
      id: 'agent-1',
      name: 'Your Custom Agent',
      description: 'Custom description',
      // ... other required fields
    },
  ];
});
```

## Features Supported in Mock Mode

✅ **Fully Functional:**

- Dark/Light theme switching
- Navigation between views
- Agent listing and status
- Chat interface UI
- Settings management
- All UI components

⚠️ **Simulated (not persisted):**

- Agent creation/updates
- Chat messages
- Settings changes
- Preset modifications

❌ **Not Available:**

- Real LLM responses
- File system access
- Persistent data storage
- Electron-specific features

## Development Workflow

1. **UI Development**: Use `pnpm dev:web` for rapid UI iteration
2. **Component Testing**: Mock data ensures consistent testing
3. **Theme Development**: Test light/dark modes easily
4. **Responsive Design**: Test in browser with dev tools

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5173
lsof -i :5173
# Kill the process if needed
kill -9 <PID>
```

### Mock Data Not Loading

1. Check browser console for errors
2. Ensure MockRpcTransport handlers match contract channels
3. Verify schema compatibility with `@agentos/core` types

### Theme Not Persisting

- Theme is stored in localStorage
- Check browser dev tools > Application > Local Storage
- Key: `agentOS-theme`

## Adding New Mock Handlers

When adding new RPC methods:

1. Check the contract file for exact channel name:

   ```typescript
   // src/shared/rpc/contracts/[service].contract.ts
   export const ServiceContract = defineContract({
     methods: {
       'method-name': {
         channel: 'service.method-name', // Use this exact string
         // ...
       },
     },
   });
   ```

2. Add handler in MockRpcTransport:

   ```typescript
   this.handlers.set('service.method-name', async (data) => {
     return {
       // Return data matching the contract response schema
     };
   });
   ```

3. Test in browser console:
   ```javascript
   // Access service from console
   const service = window.__SERVICE_CONTAINER__.get('service');
   await service.methodName();
   ```

## Best Practices

1. **Keep Mock Data Realistic**: Use data that represents real scenarios
2. **Match Schemas Exactly**: Ensure mock data matches TypeScript interfaces
3. **Test Both Themes**: Always verify UI works in light and dark modes
4. **Use Browser DevTools**: Leverage React DevTools and network inspection
5. **Document Changes**: Update this guide when adding new mock services

## Related Documentation

- [Frontend Architecture & Patterns](./frontend/patterns.md)
- [RPC & Streaming Guide](./RPC_AND_STREAMING_GUIDE.md)
- [Frontend Implementation Roadmap](./frontend/roadmap.md)
