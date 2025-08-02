import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '../shared/types/electron-api';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI: ElectronAPI = {
  // Chat Session APIs
  chat: {
    createSession: (options?: { preset?: any }) =>
      ipcRenderer.invoke('chat:create-session', options),
    listSessions: () => ipcRenderer.invoke('chat:list-sessions'),
    loadSession: (sessionId: string) => ipcRenderer.invoke('chat:load-session', sessionId),
    sendMessage: (sessionId: string, message: string) =>
      ipcRenderer.invoke('chat:send-message', sessionId, message),
    streamMessage: (sessionId: string, message: string) =>
      ipcRenderer.invoke('chat:stream-message', sessionId, message),
    getMessages: (sessionId: string, options?: any) =>
      ipcRenderer.invoke('chat:get-messages', sessionId, options),
    deleteSession: (sessionId: string) => ipcRenderer.invoke('chat:delete-session', sessionId),
    renameSession: (sessionId: string, newName: string) =>
      ipcRenderer.invoke('chat:rename-session', sessionId, newName),
  },

  // Bridge APIs
  bridge: {
    register: (id: string, config: any) => ipcRenderer.invoke('bridge:register', id, config),
    unregister: (id: string) => ipcRenderer.invoke('bridge:unregister', id),
    switch: (id: string) => ipcRenderer.invoke('bridge:switch', id),
    getCurrent: () => ipcRenderer.invoke('bridge:get-current'),
    getIds: () => ipcRenderer.invoke('bridge:get-ids'),
    getConfig: (id: string) => ipcRenderer.invoke('bridge:get-config', id),
  },

  // MCP APIs
  mcp: {
    getAll: () => ipcRenderer.invoke('mcp:get-all'),
    connect: (config: any) => ipcRenderer.invoke('mcp:connect', config),
    disconnect: (name: string) => ipcRenderer.invoke('mcp:disconnect', name),
    executeTool: (clientName: string, toolName: string, args: any) =>
      ipcRenderer.invoke('mcp:execute-tool', clientName, toolName, args),
    getResources: (clientName: string) => ipcRenderer.invoke('mcp:get-resources', clientName),
    readResource: (clientName: string, uri: string) =>
      ipcRenderer.invoke('mcp:read-resource', clientName, uri),
    getStatus: (clientName: string) => ipcRenderer.invoke('mcp:get-status', clientName),
  },

  // Preset APIs
  preset: {
    getAll: () => ipcRenderer.invoke('preset:get-all'),
    create: (preset: any) => ipcRenderer.invoke('preset:create', preset),
    update: (preset: any) => ipcRenderer.invoke('preset:update', preset),
    delete: (id: string) => ipcRenderer.invoke('preset:delete', id),
    get: (id: string) => ipcRenderer.invoke('preset:get', id),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
