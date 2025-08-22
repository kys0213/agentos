import { RpcEndpoint } from '../rpc-endpoint';
import type { FrameTransport } from '../../../shared/rpc/transport';
import type { RpcFrame } from '../../../shared/rpc/rpc-frame';

describe('RpcEndpoint.on close() sends cancel (can) frame', () => {
  it('posts can with same cid as req when close is awaited', async () => {
    const posted: RpcFrame[] = [];

    const transport: FrameTransport = {
      start: () => {},
      post: (frame: RpcFrame) => posted.push(frame),
    };

    const rpc = new RpcEndpoint(transport);
    rpc.start();

    const close = rpc.on('demo.stream', () => {});

    // First frame should be a request for the stream
    expect(posted.length).toBeGreaterThan(0);
    const req = posted.find((f) => f.kind === 'req');
    expect(req).toBeTruthy();

    // Close subscription and expect cancel to be posted immediately
    await close();

    const can = posted.find((f) => f.kind === 'can' && (f as any).cid === (req as any)?.cid);
    expect(can).toBeTruthy();

    rpc.stop();
  });
});

