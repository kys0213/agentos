import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { LlmBridge, LlmManifest } from 'llm-bridge-spec';

/**
 * Main 프로세스에서 관리되는 Bridge 매니저
 * Renderer의 BridgeManager 기능을 Main으로 이동
 */
class MainBridgeManager {
  private bridges = new Map<string, { bridge: LlmBridge; config: LlmManifest }>();
  private currentId?: string;

  register(id: string, bridge: LlmBridge, config: LlmManifest): void {
    this.bridges.set(id, { bridge, config });

    if (!this.currentId) {
      this.currentId = id;
    }

    console.log(`Bridge ${id} registered in main process`);
  }

  unregister(id: string): boolean {
    const existed = this.bridges.delete(id);
    if (this.currentId === id) {
      // 현재 브릿지가 제거되면 다른 브릿지로 자동 전환
      const remainingIds = Array.from(this.bridges.keys());
      this.currentId = remainingIds.length > 0 ? remainingIds[0] : undefined;
    }
    console.log(`Bridge ${id} unregistered from main process`);
    return existed;
  }

  async switchBridge(id: string): Promise<void> {
    if (!this.bridges.has(id)) {
      throw new Error(`Bridge ${id} not registered`);
    }
    this.currentId = id;
    console.log(`Switched to bridge ${id}`);
  }

  getCurrentBridge(): { id: string; bridge: LlmBridge; config: LlmManifest } | null {
    if (!this.currentId) {
      return null;
    }
    const bridgeInfo = this.bridges.get(this.currentId);
    if (!bridgeInfo) {
      return null;
    }
    return {
      id: this.currentId,
      bridge: bridgeInfo.bridge,
      config: bridgeInfo.config,
    };
  }

  getCurrentId(): string | undefined {
    return this.currentId;
  }

  getBridgeIds(): string[] {
    return Array.from(this.bridges.keys());
  }

  getBridgeConfig(id: string): any | null {
    const bridgeInfo = this.bridges.get(id);
    return bridgeInfo ? bridgeInfo.config : null;
  }
}

// 전역 Bridge 매니저 인스턴스
let bridgeManager: MainBridgeManager | null = null;

function initializeBridgeManager(): MainBridgeManager {
  if (bridgeManager) return bridgeManager;

  bridgeManager = new MainBridgeManager();
  console.log('Bridge manager initialized in main process');
  return bridgeManager;
}

export function setupBridgeIpcHandlers() {
  const manager = initializeBridgeManager();

  // Bridge 등록
  ipcMain.handle(
    'bridge:register-bridge',
    async (_event: IpcMainInvokeEvent, config: LlmManifest) => {
      try {
        // TODO: 실제 브릿지 등록 로직 구현
        return { success: true };
      } catch (error) {
        console.error('Failed to register bridge:', error);
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // Bridge 등록 해제
  ipcMain.handle('bridge:unregister-bridge', async (_event: IpcMainInvokeEvent, id: string) => {
    try {
      const success = manager.unregister(id);
      return { success };
    } catch (error) {
      console.error('Failed to unregister bridge:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Bridge 전환
  ipcMain.handle('bridge:switch', async (_event: IpcMainInvokeEvent, id: string) => {
    try {
      await manager.switchBridge(id);
      return { success: true };
    } catch (error) {
      console.error('Failed to switch bridge:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 현재 Bridge 조회
  ipcMain.handle('bridge:get-current', async (_event: IpcMainInvokeEvent) => {
    try {
      const current = manager.getCurrentBridge();
      if (!current) {
        return null;
      }
      return {
        id: current.id,
        config: current.config,
      };
    } catch (error) {
      console.error('Failed to get current bridge:', error);
      throw error;
    }
  });

  // Bridge ID 목록 조회
  ipcMain.handle('bridge:get-ids', async (_event: IpcMainInvokeEvent) => {
    try {
      const ids = manager.getBridgeIds();
      return ids;
    } catch (error) {
      console.error('Failed to get bridge IDs:', error);
      throw error;
    }
  });

  // Bridge 설정 조회
  ipcMain.handle('bridge:get-config', async (_event: IpcMainInvokeEvent, id: string) => {
    try {
      const config = manager.getBridgeConfig(id);
      return config;
    } catch (error) {
      console.error('Failed to get bridge config:', error);
      throw error;
    }
  });

  console.log('Bridge IPC handlers registered');
}

// 다른 서비스에서 Bridge Manager에 접근할 수 있도록 export
export function getBridgeManager(): MainBridgeManager | null {
  return bridgeManager;
}
