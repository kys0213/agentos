import { RpcEndpoint } from '../rpc-endpoint';
import type { FrameTransport } from '../../../shared/rpc/transport';
import type { RpcFrame } from '../../../shared/rpc/rpc-frame';

// Timeout configured via vitest.config; no per-suite override

describe('RpcEndpoint stream cancel posts can frame', () => {
  it('posts can when iterator is returned early', async () => {
    const posted: RpcFrame[] = [];
    let onFrame: ((f: RpcFrame) => void) | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let reqCid: string | null = null;
    let resolveReq: ((cid: string) => void) | null = null;
    const reqSeen = new Promise<string>((resolve) => (resolveReq = resolve));

    const transport: FrameTransport = {
      start(cb) {
        onFrame = cb;
      },
      post(frame) {
        posted.push(frame);
        if (frame.kind === 'req') {
          reqCid = frame.cid;
          resolveReq?.(frame.cid);
          // 데모 스트림: 일정 주기로 nxt 프레임 방출
          let n = 0;
          interval = setInterval(() => {
            onFrame?.({ kind: 'nxt', cid: frame.cid, data: n++ } as RpcFrame);
          }, 20);
        }
        if (frame.kind === 'can') {
          // 취소가 오면 스트림 종료 신호 전송 및 타이머 정리
          if (interval) clearInterval(interval);
          interval = null;
          onFrame?.({ kind: 'end', cid: frame.cid } as RpcFrame);
        }
      },
    };

    const rpc = new RpcEndpoint(transport);
    rpc.start();

    const it = rpc.stream('demo.stream');
    // 스트림 본문을 시작하여 req 전송을 트리거
    void it.next();

    const cid = await Promise.race<string>([
      reqSeen,
      new Promise<string>((_, rej) =>
        setTimeout(() => rej(new Error('timeout waiting req')), 1500)
      ),
    ]);

    // 조기 종료 -> can 프레임 전송 기대
    await it.return?.();
    await new Promise((r) => setTimeout(r, 10));

    const can = posted.find((f) => f.kind === 'can' && f.cid === cid);
    expect(can).toBeTruthy();
    rpc.stop();
  });
});
