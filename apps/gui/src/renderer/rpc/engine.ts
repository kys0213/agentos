import type { RpcTransport, RpcMethodMap } from './types';

export interface RpcEndpointOptions {
  timeoutMs?: number;
  onLog?: (frame: unknown) => void;
}

export class RpcEndpoint {
  constructor(
    private readonly transport: RpcTransport,
    private readonly opts?: RpcEndpointOptions
  ) {}

  async request<M extends keyof RpcMethodMap>(
    method: M,
    payload: RpcMethodMap[M]['req']
  ): Promise<RpcMethodMap[M]['res']> {
    const start = Date.now();
    try {
      const res = await this.transport.request(method, payload as any);
      return res as RpcMethodMap[M]['res'];
    } finally {
      if (this.opts?.onLog) this.opts.onLog({ kind: 'req', method, dt: Date.now() - start });
    }
  }

  stream<M extends keyof RpcMethodMap>(
    method: M,
    payload: RpcMethodMap[M]['req']
  ): AsyncGenerator<RpcMethodMap[M]['res']> {
    if (!this.transport.stream) throw new Error('Transport does not support streaming');
    return this.transport.stream(method, payload as any) as any;
  }
}
