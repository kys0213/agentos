export interface ElectronAPI {
  chat: {
    createSession: (...args: any[]) => Promise<any>;
    getSessions: () => Promise<any[]>;
    sendMessage: (sessionId: string, message: string) => Promise<any>;
  };
  mcp: {
    getClients: () => Promise<any[]>;
    connectClient: (config: any) => Promise<any>;
  };
  preset: {
    getAll: () => Promise<any[]>;
    save: (preset: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}