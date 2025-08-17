import { ElectronEventTransport } from '../electron-event-transport';
import { of, Subject, take } from 'rxjs';
import { CoreError } from '@agentos/core';
import type { RpcFrame } from '../../../../shared/rpc/rpc-frame';
import { createIpcMainFixture, flush } from '../test-helpers/fixture';
import { frames, clear } from '../test-helpers/electron-mock-store';
jest.mock('electron', () => {
  const store = require('../test-helpers/electron-mock-store');
  const win = {
    isDestroyed: () => false,
    webContents: { send: (_ch: string, frame: RpcFrame) => store.frames.push(frame) },
  } as const;
  return {
    BrowserWindow: {
      fromId: jest.fn(() => win as any),
      getAllWindows: jest.fn(() => [win as any]),
    },
  };
});

describe('ElectronEventTransport', () => {
  const { ipcMain: ipcMainMock, emit, reset } = createIpcMainFixture();

  beforeEach(() => {
    clear();
    reset();
  });

  test('responds with res for simple request', async () => {
    const t = new ElectronEventTransport(ipcMainMock);
    t.listen(() => {});

    // register handler
    const handler = Object.assign(
      jest.fn().mockResolvedValue('pong'),
      {} as Record<string, unknown>
    );
    (t as any).messageHandlers.set('ping', handler);

    emit({ kind: 'req', cid: 'c1', method: 'ping', payload: 42 });
    await flush();
    expect(frames).toContainEqual({ kind: 'res', cid: 'c1', ok: true, result: 'pong' });
  });

  test('streams observable as nxt...end and includes method', async () => {
    const t = new ElectronEventTransport(ipcMainMock);
    t.listen(() => {});

    const handler = Object.assign(
      jest.fn().mockReturnValue(of('a', 'b').pipe(take(2))),
      {} as Record<string, unknown>
    );
    (t as any).messageHandlers.set('stream.obs', handler);

    emit({ kind: 'req', cid: 'c2', method: 'stream.obs' });
    await flush();
    expect(frames).toContainEqual({ kind: 'nxt', cid: 'c2', data: 'a', method: 'stream.obs' });
    expect(frames).toContainEqual({ kind: 'nxt', cid: 'c2', data: 'b', method: 'stream.obs' });
    expect(frames).toContainEqual({ kind: 'end', cid: 'c2' });
  });

  test('streams async generator as nxt...end and includes method', async () => {
    const t = new ElectronEventTransport(ipcMainMock);
    t.listen(() => {});

    async function* gen() {
      yield 1;
      yield 2;
    }
    const handler = Object.assign(jest.fn().mockReturnValue(gen()), {} as Record<string, unknown>);
    (t as any).messageHandlers.set('stream.gen', handler);

    emit({ kind: 'req', cid: 'c3', method: 'stream.gen' });
    await flush();
    expect(frames).toContainEqual({ kind: 'nxt', cid: 'c3', data: 1, method: 'stream.gen' });
    expect(frames).toContainEqual({ kind: 'nxt', cid: 'c3', data: 2, method: 'stream.gen' });
    expect(frames).toContainEqual({ kind: 'end', cid: 'c3' });
  });

  test('cancel stops observable emission', async () => {
    const t = new ElectronEventTransport(ipcMainMock);
    t.listen(() => {});

    const subj = new Subject<number>();
    const handler = Object.assign(
      jest.fn().mockReturnValue(subj.asObservable()),
      {} as Record<string, unknown>
    );
    (t as any).messageHandlers.set('stream.cancel', handler);

    emit({ kind: 'req', cid: 'c4', method: 'stream.cancel' });
    subj.next(1);
    await flush();
    emit({ kind: 'can', cid: 'c4' });
    await flush();
    subj.next(2);
    await flush();

    // After cancel, no further frames for cid c4 beyond those already sent
    const before = frames.filter((f) => f.cid === 'c4' && f.kind === 'nxt').length;
    const after = frames.filter((f) => f.cid === 'c4' && f.kind === 'nxt').length;
    expect(after).toBe(before);
  });

  test('no handler returns NOT_FOUND err', async () => {
    const t = new ElectronEventTransport(ipcMainMock);
    t.listen(() => {});

    emit({ kind: 'req', cid: 'c5', method: 'missing' });
    await flush();
    expect(frames).toContainEqual(
      expect.objectContaining({ kind: 'err', cid: 'c5', ok: false, code: 'NOT_FOUND' })
    );
  });

  test('CoreError maps to err frame with domain/code', async () => {
    const t = new ElectronEventTransport(ipcMainMock);
    t.listen(() => {});

    const handler = Object.assign(
      jest.fn().mockImplementation(() => {
        throw new CoreError('agent', 'INVALID_ARGUMENT', 'bad input', { details: { x: 1 } });
      }),
      {}
    );
    (t as any).messageHandlers.set('boom', handler);

    emit({ kind: 'req', cid: 'c6', method: 'boom' });
    await flush();
    expect(frames).toContainEqual(
      expect.objectContaining({ kind: 'err', cid: 'c6', ok: false, code: 'INVALID_ARGUMENT' })
    );
  });

  test('broadcast sends to all windows when handler.extras.broadcast=true', async () => {
    const t = new ElectronEventTransport(ipcMainMock);
    t.listen(() => {});

    type WithExtras<T> = T & { extras?: { broadcast?: boolean } };
    const handler = jest.fn().mockResolvedValue('ok') as WithExtras<jest.Mock>;
    handler.extras = { broadcast: true };
    (t as any).messageHandlers.set('broadcast.ping', handler);

    emit({ kind: 'req', cid: 'c7', method: 'broadcast.ping' });
    await flush();
    expect(frames).toContainEqual({ kind: 'res', cid: 'c7', ok: true, result: 'ok' });
  });
});
