import type { RpcTransport } from '../../../shared/rpc/transport';
import type { RpcFrame } from '../../../shared/rpc/rpc-frame';
import { RpcEndpoint } from '../rpc-endpoint';

export class EndpointClient implements RpcTransport {
  constructor(private readonly endpoint: RpcEndpoint) {}

  // Low-level methods are no-ops here; consumers should not call them
  start(_onFrame: (f: RpcFrame) => void): void {}
  post(_frame: RpcFrame): void {}
  stop(): void {
    this.endpoint.stop();
  }

  request<TRes = unknown, TReq = unknown>(channel: string, payload?: TReq): Promise<TRes> {
    return this.endpoint.request<TRes>(channel, payload as unknown);
  }

  stream?<T = unknown>(channel: string, _handler: (data: T) => void): Promise<() => void>;
}

