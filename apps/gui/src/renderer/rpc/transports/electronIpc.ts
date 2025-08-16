import type { RpcTransport } from '../transport';

export class ElectronIpcTransport implements RpcTransport {
  private get rpc() {
    if (typeof window === 'undefined' || !(window as any).rpc) {
      throw new Error('window.rpc is not available. Ensure preload exposes it.');
    }
    return (window as any).rpc as { request: (ch: string, payload?: unknown) => Promise<unknown> };
  }
  private get bridge() {
    if (typeof window === 'undefined' || !(window as any).electronBridge) {
      throw new Error('electronBridge is not available. Ensure preload exposes it.');
    }
    return (window as any).electronBridge as {
      on: (ch: string, handler: (payload: unknown) => void) => () => void;
    };
  }

  async request<TRes = unknown, TReq = unknown>(channel: string, payload?: TReq): Promise<TRes> {
    const res = await this.rpc.request(channel, payload as unknown);
    return res as TRes;
  }

  async stream<T = unknown>(channel: string, handler: (data: T) => void): Promise<() => void> {
    // Generic event subscription; main must emit events on this channel
    return this.bridge.on(channel, (data: unknown) => handler(data as T));
  }
}
