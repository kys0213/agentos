import { RpcFrame } from '../../../shared/rpc/rpc-frame';
import type { RpcTransport } from '../../../shared/rpc/transport';
import { RpcEndpoint } from '../rpc-endpoint';

export class ElectronIpcTransport implements RpcTransport {
  private endpoint?: RpcEndpoint;

  constructor(private bridge: RpcTransport) {}

  start(onFrame: (f: RpcFrame) => void): void {
    this.bridge.start(onFrame);
  }
  post(frame: RpcFrame): void {
    this.bridge.post(frame);
  }
  stop?(): void {
    if (this.bridge.stop) {
      this.bridge.stop();
      this.endpoint?.stop();
    }
  }

  private ensureEndpoint() {
    if (!this.endpoint) {
      this.endpoint = new RpcEndpoint(this);
      this.endpoint.start();
    }
    return this.endpoint;
  }

  async request<TRes = unknown, TReq = unknown>(channel: string, payload?: TReq): Promise<TRes> {
    const ep = this.ensureEndpoint();
    return ep.request<TRes>(channel, payload as any);
  }

  async stream<T = unknown>(channel: string, handler: (data: T) => void): Promise<() => void> {
    const ep = this.ensureEndpoint();
    const it = ep.stream<T>(channel);
    let closed = false;
    (async () => {
      try {
        for await (const v of it) {
          if (closed) break;
          handler(v);
        }
      } catch {
        // swallow
      }
    })();
    return async () => {
      closed = true;
      if (typeof (it as any).return === 'function') await (it as any).return();
    };
  }
}
