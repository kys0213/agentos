import { RpcEndpoint } from '../rpc-endpoint';
import type { FrameTransport } from '../../../shared/rpc/transport';
import type { RpcFrame } from '../../../shared/rpc/rpc-frame';

describe('RpcEndpoint stream cancel posts can frame', () => {
  it('posts can when iterator is returned early', async () => {
    const posted: RpcFrame[] = [];
    let onFrame: ((f: RpcFrame) => void) | null = null;

    const transport: FrameTransport = {
      start(cb) {
        onFrame = cb;
      },
      post(frame) {
        posted.push(frame);
      },
    };

    const rpc = new RpcEndpoint(transport);
    rpc.start();

    const it = rpc.stream('demo.stream');
    // Prime the iterator without awaiting (start generator)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (it as any).next?.();
    // First post should be a req with a cid
    expect(posted[0].kind).toBe('req');
    const cid = (posted[0] as any).cid as string;

    // Return early
    await (it as any).return?.();

    // Expect cancel to be posted with same cid
    const can = posted.find((f) => f.kind === 'can' && (f as any).cid === cid);
    expect(can).toBeTruthy();
    rpc.stop();
  });
});
