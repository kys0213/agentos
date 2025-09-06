import { RpcEndpoint } from '../rpc-endpoint';
import type { FrameTransport } from '../../../shared/rpc/transport';
import type { RpcFrame } from '../../../shared/rpc/rpc-frame';
import { McpUsageRpcService } from '../services/mcp-usage.service';

// Timeout configured via vitest.config; no per-suite override

describe('McpUsageRpcService.subscribeToUsageUpdates cancel semantics', () => {
  it('posts can on unsubscribe and stops receiving events', async () => {
    const posted: RpcFrame[] = [];
    let onFrame: ((f: RpcFrame) => void) | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let resolveReq: ((cid: string) => void) | null = null;
    const reqSeen = new Promise<string>((resolve) => (resolveReq = resolve));

    const transport: FrameTransport = {
      start(cb) {
        onFrame = cb;
      },
      post(frame) {
        posted.push(frame);
        if (frame.kind === 'req' && frame.method === 'mcp.usage.events') {
          // remember cid and simulate periodic nxt frames
          const cid = frame.cid;
          resolveReq?.(cid);
          let n = 0;
          interval = setInterval(() => {
            const ev = {
              type: 'usage-logged',
              clientName: 'demo-client',
              newLog: {
                id: `log-${n}`,
                timestamp: new Date(),
                operation: 'tool.call',
                status: 'success',
              },
              timestamp: new Date(),
            } as const;
            onFrame?.({ kind: 'nxt', cid, data: ev } as RpcFrame);
            n++;
          }, 20);
        }
        if (frame.kind === 'can') {
          // server acknowledges cancel by ending the stream
          if (interval) {
            clearInterval(interval);
          }
          interval = null;
          onFrame?.({ kind: 'end', cid: frame.cid } as RpcFrame);
        }
      },
    };

    const endpoint = new RpcEndpoint(transport);
    endpoint.start();
    const svc = new McpUsageRpcService(endpoint);

    let received = 0;
    const unsubscribe = await svc.subscribeToUsageUpdates(() => {
      received++;
    });

    const cid = await Promise.race<string>([
      reqSeen,
      new Promise<string>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500)),
    ]);
    expect(
      posted.find((f) => f.kind === 'req' && f.method === 'mcp.usage.events' && f.cid === cid)
    ).toBeTruthy();

    // allow few events
    await new Promise((r) => setTimeout(r, 50));
    expect(received).toBeGreaterThan(0);

    // unsubscribe should post 'can' and stop events
    await unsubscribe();
    await new Promise((r) => setTimeout(r, 20));
    const can = posted.find((f) => f.kind === 'can' && f.cid === cid);
    expect(can).toBeTruthy();

    const countAfter = received;
    await new Promise((r) => setTimeout(r, 50));
    expect(received).toBe(countAfter); // no more events

    endpoint.stop();
  });
});
