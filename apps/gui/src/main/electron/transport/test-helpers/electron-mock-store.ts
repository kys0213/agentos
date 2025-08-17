import type { RpcFrame } from '../../../../shared/rpc/rpc-frame';

export const frames: RpcFrame[] = [];
export const clear = () => {
  frames.length = 0;
};

