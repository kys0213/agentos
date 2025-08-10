# Agent API Alignment – Change Log

This document summarizes the logical change sets applied while aligning GUI to the new AgentOsAPI/IpcChannel spec.

1. docs(gui): add Agent API alignment plan (requirements, interface sketch, TODOs, sequence)
2. feat(gui-main): align preload API and service registry to AgentOsAPI spec; bridge handlers use registerBridge(config) signature
3. feat(gui-main): add domain IPC handlers – agent, builtinTool, mcpUsageLog; split usage channels from mcp
4. feat(renderer-ipc): rewrite ElectronIpcChannel to match IpcChannel; simplify factory; remove unused web/extension channels
5. feat(services): refactor Bridge/Mcp/Preset services to new names; add BuiltinToolService; provide compatibility aliases
6. feat(mock): replace MockIpcChannel with spec-compliant minimal implementation
7. feat(renderer): update components/hooks for usage logs/presets; add temporary ChatService adapter
8. feat(agent): implement agent:chat/endSession with in-memory sessions and echo reply
9. chore: repository-wide typecheck pass (pnpm -r typecheck)

Note: Some of the initial steps landed together due to a large staged change set. Subsequent changes will be committed as smaller, logically isolated units per the Git Workflow Guide.
