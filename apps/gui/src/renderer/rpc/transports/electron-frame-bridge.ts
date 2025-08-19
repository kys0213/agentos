import type { RpcFrame } from '../../../shared/rpc/rpc-frame';

type BridgeLike = {
  start: (onFrame: (f: RpcFrame) => void) => void;
  post: (frame: RpcFrame) => void;
  stop?: () => void;
};

export class ElectronFrameBridge {
  private bridge: BridgeLike;

  constructor(bridge?: BridgeLike) {
    const b =
      bridge ||
      (typeof window !== 'undefined' && (window as any).electronBridge
        ? ((window as any).electronBridge as BridgeLike)
        : null);
    if (!b || typeof b.start !== 'function' || typeof b.post !== 'function') {
      throw new Error('ElectronFrameBridge: electronBridge not available');
    }
    this.bridge = b;
  }

  start(onFrame: (f: RpcFrame) => void): void {
    this.bridge.start(onFrame);
  }
  post(frame: RpcFrame): void {
    this.bridge.post(frame);
  }
  stop(): void {
    this.bridge.stop?.();
  }
}

