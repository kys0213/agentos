import { RpcFrame } from './rpc-frame';

export interface RpcTransport {
  /** start receives frames (from other side) */
  start(onFrame: (f: RpcFrame) => void): void;

  /** send frame to the other side */
  post(frame: RpcFrame): void;

  /** optional cleanup */
  stop?(): void;

  /** higher-level helpers */
  request<TRes = unknown, TReq = unknown>(channel: string, payload?: TReq): Promise<TRes>;
  stream?<T = unknown>(channel: string, handler: (data: T) => void): Promise<() => void>;
}
