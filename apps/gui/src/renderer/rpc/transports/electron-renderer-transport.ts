import { RpcFrame } from '../../../shared/rpc/rpc-frame';
import type { CloseFn, RpcTransport } from '../../../shared/rpc/transport';
import { RpcEndpoint } from '../rpc-endpoint';

export class ElectronRendererTransport implements RpcTransport {
  private endpoint: RpcEndpoint;

  constructor(private readonly bridge: RpcTransport) {
    this.endpoint = new RpcEndpoint(this);
  }

  start(onFrame: (f: RpcFrame) => void): void {
    this.bridge.start(onFrame);
  }
  post(frame: RpcFrame): void {
    this.bridge.post(frame);
  }

  stop?(): void {
    if (this.bridge.stop) {
      this.bridge.stop();
      this.endpoint?.clear();
    }
  }

  async request<TRes = unknown, TReq = unknown>(channel: string, payload?: TReq): Promise<TRes> {
    return this.endpoint.request<TRes>(channel, payload);
  }

  async stream<T = unknown>(channel: string, handler: (data: T) => void): Promise<CloseFn> {
    const it = this.endpoint.stream<T>(channel);
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
      if (typeof it.return === 'function') {
        await it.return();
      }
    };
  }
}
