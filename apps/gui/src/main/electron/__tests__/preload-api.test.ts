import { createElectronBridge, createRpc, IpcLike } from '../preload-api';

class MockIpc implements IpcLike {
  private listeners = new Map<string, Set<(e: unknown, p: any) => void>>();
  public sent: { channel: string; payload: any }[] = [];
  on = (channel: string, listener: (e: unknown, p: any) => void) => {
    if (!this.listeners.has(channel)) this.listeners.set(channel, new Set());
    this.listeners.get(channel)!.add(listener);
  };
  off = (channel: string, listener: (e: unknown, p: any) => void) => {
    this.listeners.get(channel)?.delete(listener);
  };
  send = (channel: string, payload: any) => {
    this.sent.push({ channel, payload });
  };
  emit(channel: string, payload: any) {
    this.listeners.get(channel)?.forEach((l) => l({}, payload));
  }
}

describe('preload-api factories', () => {
  test('electronBridge.on returns unsubscribe and removes listener', () => {
    const ipc = new MockIpc();
    const bridge = createElectronBridge(ipc);
    const handler = jest.fn();
    const off = bridge.on('foo', handler);
    ipc.emit('foo', { a: 1 });
    expect(handler).toHaveBeenCalledWith({ a: 1 });
    off();
    ipc.emit('foo', { a: 2 });
    // no additional call after unsubscribe
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('rpc.request resolves res and unsubscribes frame listener', async () => {
    const ipc = new MockIpc();
    const rpc = createRpc(ipc);

    // Kick off request
    const p = rpc.request('preset.list', { page: 1 });
    // Extract the last sent req to know cid
    const last = ipc.sent[ipc.sent.length - 1];
    expect(last.channel).toBe('bridge:post');
    const cid = last.payload.cid;
    // Emit a res with matching cid
    ipc.emit('bridge:frame', { kind: 'res', cid, ok: true, result: ['a', 'b'] });
    await expect(p).resolves.toEqual(['a', 'b']);

    // Further emits for same cid should not cause handler errors (already unsubscribed)
    expect(() =>
      ipc.emit('bridge:frame', { kind: 'res', cid, ok: true, result: [] })
    ).not.toThrow();
  });

  test('rpc.request rejects on err frame and includes fields', async () => {
    const ipc = new MockIpc();
    const rpc = createRpc(ipc);
    const p = rpc.request('preset.list', {});
    const cid = ipc.sent[ipc.sent.length - 1].payload.cid;
    ipc.emit('bridge:frame', {
      kind: 'err',
      cid,
      ok: false,
      message: 'NO_HANDLER',
      code: 'NOT_FOUND',
      domain: 'common',
    });
    await expect(p).rejects.toHaveProperty('message', 'NO_HANDLER');
  });

  test('rpc.request ignores frames with different cid', async () => {
    const ipc = new MockIpc();
    const rpc = createRpc(ipc);
    const p = rpc.request('preset.list', {});
    const cid = ipc.sent[ipc.sent.length - 1].payload.cid;
    // Emit unrelated frame first
    ipc.emit('bridge:frame', { kind: 'res', cid: 'other', ok: true, result: 1 });
    // Now real response
    ipc.emit('bridge:frame', { kind: 'res', cid, ok: true, result: 2 });
    await expect(p).resolves.toBe(2);
  });
});
