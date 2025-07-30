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
  },

  // MCP APIs
  mcp: {
    getAll: () => ipcRenderer.invoke('mcp:get-all'),
    connect: (config: any) => ipcRenderer.invoke('mcp:connect', config),
    disconnect: (name: string) => ipcRenderer.invoke('mcp:disconnect', name),
  },

  // Preset APIs
  preset: {
    getAll: () => ipcRenderer.invoke('preset:get-all'),
    create: (preset: any) => ipcRenderer.invoke('preset:create', preset),
    update: (preset: any) => ipcRenderer.invoke('preset:update', preset),
    delete: (id: string) => ipcRenderer.invoke('preset:delete', id),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
