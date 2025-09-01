import { Controller } from '@nestjs/common';
import { EventPattern, Payload, MicroserviceOptions } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { of, take } from 'rxjs';
import { ElectronEventTransport } from '../electron-event-transport';
import { CoreError } from '@agentos/core';
import type { RpcFrame } from '../../../../shared/rpc/rpc-frame';
import { createIpcMainFixture, flush } from '../test-helpers/fixture';
import { frames, clear } from '../test-helpers/electron-mock-store';
jest.mock('electron', () => {
  const win = {
    isDestroyed: () => false,
    webContents: { send: (_ch: string, frame: RpcFrame) => frames.push(frame) },
  } as const;
  return {
    BrowserWindow: {
      fromId: jest.fn(() => win),
      getAllWindows: jest.fn(() => [win]),
    },
  };
});
const { ipcMain: ipcMainMock, emit, reset } = createIpcMainFixture();

@Controller()
class MockController {
  @EventPattern('mock.echo')
  echo(@Payload() payload: string) {
    return `echo:${payload}`;
  }

  @EventPattern('mock.stream')
  stream(@Payload() n: number) {
    return of('x', 'y', 'z').pipe(take(n));
  }

  @EventPattern('mock.error')
  err() {
    throw new CoreError('agent', 'INVALID_ARGUMENT', 'bad input');
  }
}

describe('ElectronEventTransport (Nest microservice)', () => {
  beforeEach(() => {
    clear();
    reset();
  });

  it('handles request/response via controller', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MockController],
    }).compile();

    const app = moduleRef.createNestMicroservice<MicroserviceOptions>({
      strategy: new ElectronEventTransport(ipcMainMock),
    });
    await app.listen();

    emit({ kind: 'req', cid: 'c1', method: 'mock.echo', payload: 'hello' });
    await flush();

    expect(frames).toContainEqual({ kind: 'res', cid: 'c1', ok: true, result: 'echo:hello' });

    await app.close();
  });

  it('streams observable methods and includes method in nxt', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MockController],
    }).compile();

    const app = moduleRef.createNestMicroservice<MicroserviceOptions>({
      strategy: new ElectronEventTransport(ipcMainMock),
    });
    await app.listen();

    emit({ kind: 'req', cid: 'c2', method: 'mock.stream', payload: 2 });
    await flush();

    expect(frames).toContainEqual({ kind: 'nxt', cid: 'c2', data: 'x', method: 'mock.stream' });
    expect(frames).toContainEqual({ kind: 'nxt', cid: 'c2', data: 'y', method: 'mock.stream' });
    expect(frames).toContainEqual({ kind: 'end', cid: 'c2' });

    await app.close();
  });

  it('maps CoreError to err frame (code/domain)', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MockController],
    }).compile();

    const app = moduleRef.createNestMicroservice<MicroserviceOptions>({
      strategy: new ElectronEventTransport(ipcMainMock),
    });
    await app.listen();

    emit({ kind: 'req', cid: 'c3', method: 'mock.error' });
    await flush();

    expect(frames).toContainEqual(expect.objectContaining({ kind: 'err', cid: 'c3', ok: false }));

    await app.close();
  });
});
