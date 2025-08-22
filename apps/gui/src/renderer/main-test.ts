/**
 * 테스트 환경 진입점
 * MockIpcChannel을 사용하여 bootstrap 실행
 */
import { RpcFrame } from '../shared/rpc/rpc-frame';
import { CloseFn, RpcTransport } from '../shared/rpc/transport';
import { bootstrap } from './bootstrap';

// 테스트용 헬퍼 함수들
export class TestHelpers {
  private rpcTransport: RpcTransport = {
    // TODO mock transport 추가
    start: function (onFrame: (f: RpcFrame) => void): void {
      throw new Error('Function not implemented.');
    },
    post: function (frame: RpcFrame): void {
      throw new Error('Function not implemented.');
    },
    request: function <TRes = unknown, TReq = unknown>(
      channel: string,
      payload?: TReq
    ): Promise<TRes> {
      throw new Error('Function not implemented.');
    },
    on: function <T = unknown>(channel: string, handler: (payload: T) => void): CloseFn {
      throw new Error('Function not implemented.');
    },
  };

  constructor() {}

  getRpcTransport() {
    return this.rpcTransport;
  }

  async init() {
    const services = await bootstrap(this.rpcTransport);
    return services;
  }

  async reset() {
    return this.init();
  }
}

async function main() {
  const helpers = new TestHelpers();
  const services = await helpers.init();
  console.log('🧪 Test environment ready with services:', Object.keys(services));
}

main();
