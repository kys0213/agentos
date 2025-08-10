import { contextBridge, ipcRenderer } from 'electron';
import type { AgentOsAPI } from '../shared/types/agentos-api';

// Main ↔ Renderer IPC API. Shape matches AgentOsAPI exactly.
const electronAPI: AgentOsAPI = {
  agent: {
    chat: (agentId, messages, options) =>
      ipcRenderer.invoke('agent:chat', agentId, messages, options),
    endSession: (agentId, sessionId) => ipcRenderer.invoke('agent:end-session', agentId, sessionId),
    getAgentMetadata: (id) => ipcRenderer.invoke('agent:get-metadata', id),
    getAllAgentMetadatas: () => ipcRenderer.invoke('agent:get-all-metadatas'),
    updateAgent: (agentId, agent) => ipcRenderer.invoke('agent:update', agentId, agent),
    createAgent: (agent) => ipcRenderer.invoke('agent:create', agent),
    deleteAgent: (id) => ipcRenderer.invoke('agent:delete', id),
  },

  conversation: {
    listSessions: (pagination) => ipcRenderer.invoke('chat:list-sessions', pagination),
    getMessages: (sessionId, pagination) =>
      ipcRenderer.invoke('chat:get-messages', sessionId, pagination),
    deleteSession: (sessionId) => ipcRenderer.invoke('chat:delete-session', sessionId),
  },

  bridge: {
    registerBridge: (config) => ipcRenderer.invoke('bridge:register-bridge', config),
    unregisterBridge: (id) => ipcRenderer.invoke('bridge:unregister-bridge', id),
    switchBridge: (id) => ipcRenderer.invoke('bridge:switch', id),
    getCurrentBridge: () => ipcRenderer.invoke('bridge:get-current'),
    getBridgeIds: () => ipcRenderer.invoke('bridge:get-ids'),
    getBridgeConfig: (id) => ipcRenderer.invoke('bridge:get-config', id),
  },

  builtinTool: {
    getAllBuiltinTools: () => ipcRenderer.invoke('builtinTool:get-all'),
    getBuiltinTool: (id) => ipcRenderer.invoke('builtinTool:get', id),
    invokeBuiltinTool: (toolName, args) => ipcRenderer.invoke('builtinTool:invoke', toolName, args),
  },

  mcp: {
    getAllMcp: () => ipcRenderer.invoke('mcp:get-all'),
    connectMcp: (config) => ipcRenderer.invoke('mcp:connect', config),
    disconnectMcp: (name) => ipcRenderer.invoke('mcp:disconnect', name),
    executeMcpTool: (clientName, toolName, args) =>
      ipcRenderer.invoke('mcp:execute-tool', clientName, toolName, args),
    getMcpResources: (clientName) => ipcRenderer.invoke('mcp:get-resources', clientName),
    readMcpResource: (clientName, uri) => ipcRenderer.invoke('mcp:read-resource', clientName, uri),
    getMcpStatus: (clientName) => ipcRenderer.invoke('mcp:get-status', clientName),
    getToolMetadata: (clientName) => ipcRenderer.invoke('mcp:get-tool-metadata', clientName),
    getAllToolMetadata: () => ipcRenderer.invoke('mcp:get-all-tool-metadata'),
  },

  preset: {
    getAllPresets: () => ipcRenderer.invoke('preset:get-all'),
    createPreset: (preset) => ipcRenderer.invoke('preset:create', preset),
    updatePreset: (id, preset) => ipcRenderer.invoke('preset:update', id, preset),
    deletePreset: (id) => ipcRenderer.invoke('preset:delete', id),
    getPreset: (id) => ipcRenderer.invoke('preset:get', id),
  },

  mcpUsageLog: {
    getUsageLogs: (clientName, options) =>
      ipcRenderer.invoke('mcpUsageLog:get-usage-logs', clientName, options),
    getAllUsageLogs: (options) => ipcRenderer.invoke('mcpUsageLog:get-all-usage-logs', options),
    getUsageStats: (clientName) => ipcRenderer.invoke('mcpUsageLog:get-usage-stats', clientName),
    getHourlyStats: (date, clientName) =>
      ipcRenderer.invoke('mcpUsageLog:get-hourly-stats', date, clientName),
    getUsageLogsInRange: (startDate, endDate, clientName) =>
      ipcRenderer.invoke('mcpUsageLog:get-usage-logs-in-range', startDate, endDate, clientName),
    clearUsageLogs: (olderThan) => ipcRenderer.invoke('mcpUsageLog:clear-usage-logs', olderThan),
    setUsageTracking: (clientName, enabled) =>
      ipcRenderer.invoke('mcpUsageLog:set-usage-tracking', clientName, enabled),
    subscribeToUsageUpdates: (callback) =>
      ipcRenderer.invoke('mcpUsageLog:subscribe-usage-updates', callback),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
