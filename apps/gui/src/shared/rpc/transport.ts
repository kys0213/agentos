import { RpcFrame } from './rpc-frame';

// Low-level frame transport (bridge over electronBridge)
export interface FrameTransport {
  /** start receives frames (from other side) */
  start(onFrame: (f: RpcFrame) => void): void;
  /** send frame to the other side */
  post(frame: RpcFrame): void;
  /** optional cleanup */
  stop?(): void;
}

// High-level RPC client (what services depend on)
export interface RpcClient {
  request<TRes = unknown, TReq = unknown>(channel: string, payload?: TReq): Promise<TRes>;
  stream?<T = unknown>(channel: string, payload?: unknown): AsyncGenerator<T, void, unknown>;
  on<T = unknown>(channel: string, handler: (payload: T) => void): CloseFn;
}

// Back-compat combined type (to be removed after migration)
export interface RpcTransport extends FrameTransport, RpcClient {}

export type CloseFn = () => Promise<void>;
