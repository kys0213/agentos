import { RpcFrame } from './rpc-frame';

export interface RpcTransport {
  /** start receives frames (from other side) */
  start(onFrame: (f: RpcFrame) => void): void;

  /** send frame to the other side */
  post(frame: RpcFrame): void;

  /** optional cleanup */
  stop?(): void;
}
