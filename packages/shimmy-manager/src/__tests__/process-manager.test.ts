import type { ChildProcess } from 'node:child_process';
import net from 'node:net';

import { describe, expect, it, vi } from 'vitest';

import { ShimmyError } from '../errors';
import { ShimmyProcessManagerImpl } from '../process-manager';
import type { ShimmyProcessOptions } from '../types';

const baseOptions: ShimmyProcessOptions = {
  shimmyPath: '/tmp/shimmy',
  preferredPort: 12000,
  modelsDir: '/tmp/models',
  args: ['serve'],
  gpuMode: 'cpu',
  healthTimeoutMs: 1_000,
};

describe('ShimmyProcessManagerImpl (utility behaviour)', () => {
  class TestableProcessManager extends ShimmyProcessManagerImpl {
    exposeBuildArgs(options: ShimmyProcessOptions, port: number): string[] {
      return this.buildArgs(options, port);
    }

    exposeFindAvailablePort(preferred: number, limit: number): Promise<number> {
      return this.findAvailablePort(preferred, limit);
    }
  }

  it('adds bind flag when missing', () => {
    const manager = new TestableProcessManager();
    const args = manager.exposeBuildArgs({ ...baseOptions, args: ['serve'] }, 13000);
    expect(args).toContain('--bind');
    expect(args).toContain('127.0.0.1:13000');
  });

  it('replaces existing bind flag', () => {
    const manager = new TestableProcessManager();
    const args = manager.exposeBuildArgs(
      { ...baseOptions, args: ['serve', '--bind', '0.0.0.0:1'] },
      14000
    );
    expect(args).toContain('--bind');
    expect(args).toContain('127.0.0.1:14000');
    expect(args).not.toContain('0.0.0.0:1');
  });

  it('increments port when preferred is busy', async () => {
    const manager = new TestableProcessManager();

    const server = net.createServer();
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(baseOptions.preferredPort, '127.0.0.1', resolve);
    });

    try {
      const port = await manager.exposeFindAvailablePort(baseOptions.preferredPort, 5);
      expect(port).toBe(baseOptions.preferredPort + 1);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('throws when ensureReady is called while idle', async () => {
    const manager = new ShimmyProcessManagerImpl();
    Reflect.set(manager, 'state', 'idle');

    await expect(manager.ensureReady(100)).rejects.toBeInstanceOf(ShimmyError);
  });

  it('skips killing when the child never spawned', async () => {
    const manager = new ShimmyProcessManagerImpl();
    const kill = vi.fn(() => {
      throw new Error('kill should not be called');
    });

    const fakeChild: Partial<ChildProcess> & Pick<ChildProcess, 'kill'> = {
      pid: undefined,
      killed: false,
      exitCode: null,
      signalCode: null,
      kill,
    };

    Reflect.set(manager, 'child', fakeChild);
    Reflect.set(manager, 'state', 'starting');

    await expect(manager.stop()).resolves.toBeUndefined();
    expect(kill).not.toHaveBeenCalled();
  });
});
