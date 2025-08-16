import { RpcFrame } from '../../../shared/rpc/rpc-frame';
import type { RpcTransport } from '../../../shared/rpc/transport';

export class ElectronIpcTransport implements RpcTransport {
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
    }
  }
}
