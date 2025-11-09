import { spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

import { ShimmyError, toShimmyError } from './errors';
import { ShimmyProcessDefaults } from './process-manager-defaults';
import type {
  ShimmyProcessEvent,
  ShimmyProcessEventListener,
  ShimmyProcessManager,
  ShimmyProcessManagerEvents,
  ShimmyProcessOptions,
  ShimmyProcessState,
} from './types';

export class ShimmyProcessManagerImpl extends EventEmitter implements ShimmyProcessManager {
  private child: ChildProcess | null = null;
  private state: ShimmyProcessState = 'idle';
  private port: number | null = null;
  private keepAlive = false;
  private suppressNextRestart = false;
  private maxRestarts = ShimmyProcessDefaults.MAX_RESTARTS;
  private restartCount = 0;
  private options: ShimmyProcessOptions | null = null;

  async start(options: ShimmyProcessOptions): Promise<void> {
    if (this.state === 'starting' || this.state === 'ready') {
      return;
    }

    this.keepAlive = true;
    this.options = options;
    this.maxRestarts = options.maxRestarts ?? ShimmyProcessDefaults.MAX_RESTARTS;
    this.restartCount = 0;

    await this.tryStart(options);
  }

  async ensureReady(timeoutMs?: number): Promise<void> {
    if (this.state === 'ready') {
      return;
    }

    if (this.state === 'idle') {
      throw new ShimmyError({
        code: 'START_TIMEOUT',
        message: 'Shimmy process has not been started.',
      });
    }

    await new Promise<void>((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null;

      const cleanup = (): void => {
        this.off('ready', onReady);
        this.off('error', onError);
        this.off('stopped', onStopped);
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };

      const handleTimeout = (): void => {
        cleanup();
        reject(
          new ShimmyError({
            code: 'START_TIMEOUT',
            message: 'Timed out while waiting for shimmy to become ready.',
          })
        );
      };

      const onReady = (): void => {
        cleanup();
        resolve();
      };

      const onError = (error: ShimmyProcessManagerEvents['error']): void => {
        cleanup();
        reject(error);
      };

      const onStopped = (): void => {
        cleanup();
        reject(
          new ShimmyError({
            code: 'START_TIMEOUT',
            message: 'Shimmy process exited before it became ready.',
          })
        );
      };

      if (typeof timeoutMs === 'number') {
        timer = setTimeout(handleTimeout, timeoutMs);
      }

      this.once('ready', onReady);
      this.once('error', onError);
      this.once('stopped', onStopped);
    });
  }

  async stop(): Promise<void> {
    this.keepAlive = false;
    this.suppressNextRestart = true;

    await this.stopChild();

    this.state = 'idle';
    this.port = null;
    this.options = null;
    this.suppressNextRestart = false;
    this.restartCount = 0;
  }

  getPort(): number | null {
    return this.port;
  }

  getState(): ShimmyProcessState {
    return this.state;
  }

  on<Event extends ShimmyProcessEvent>(
    event: Event,
    listener: ShimmyProcessEventListener<Event>
  ): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  once<Event extends ShimmyProcessEvent>(
    event: Event,
    listener: ShimmyProcessEventListener<Event>
  ): this {
    return super.once(event, listener as (...args: unknown[]) => void);
  }

  off<Event extends ShimmyProcessEvent>(
    event: Event,
    listener: ShimmyProcessEventListener<Event>
  ): this {
    return super.off(event, listener as (...args: unknown[]) => void);
  }

  private async tryStart(options: ShimmyProcessOptions): Promise<void> {
    const portRetryLimit = options.portRetryLimit ?? ShimmyProcessDefaults.PORT_RETRY_LIMIT;
    const maxAttempts = this.maxRestarts + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const port = await this.findAvailablePort(options.preferredPort, portRetryLimit);
      try {
        await this.launchProcess(port, options, attempt);
        this.restartCount = 0;
        return;
      } catch (error) {
        const shimmyError = toShimmyError(error, {
          code: 'START_TIMEOUT',
          message: 'Failed to start shimmy sidecar.',
          details: { attempt, port },
        });

        this.emit('error', shimmyError);

        if (attempt >= maxAttempts) {
          throw shimmyError;
        }

        this.emit('restarting', { attempt, error: shimmyError });
        this.suppressNextRestart = true;
        await this.stopChild();
        await delay(ShimmyProcessDefaults.RESTART_DELAY_MS);
        this.suppressNextRestart = false;
      }
    }
  }

  private async launchProcess(
    port: number,
    options: ShimmyProcessOptions,
    attempt: number
  ): Promise<void> {
    this.state = 'starting';
    this.port = port;
    this.emit('starting', { port, attempt });

    const args = this.buildArgs(options, port);
    const env = {
      ...process.env,
      ...options.env,
      SHIMMY_MODELS_DIR: options.modelsDir,
    } satisfies NodeJS.ProcessEnv;

    const child = spawn(options.shimmyPath, args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.child = child;

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');

    child.stdout?.on('data', (chunk: Buffer | string) => {
      const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      if (text) {
        this.emit('stdout', text);
      }
    });

    child.stderr?.on('data', (chunk: Buffer | string) => {
      const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      if (text) {
        this.emit('stderr', text);
      }
    });

    child.once('exit', (code, signal) => {
      const wasStopping = this.state === 'stopping' || this.suppressNextRestart;
      this.child = null;
      this.port = null;
      this.state = 'idle';
      this.emit('stopped', { code, signal });

      if (!wasStopping && this.keepAlive) {
        this.restartCount += 1;
        if (this.restartCount <= this.maxRestarts) {
          const restartError = new ShimmyError({
            code: 'HEALTHCHECK_FAILED',
            message: 'Shimmy sidecar exited unexpectedly.',
            details: { code, signal },
          });
          this.emit('restarting', { attempt: this.restartCount, error: restartError });
          void this.restartAfterExit();
        } else {
          const exhaustedError = new ShimmyError({
            code: 'HEALTHCHECK_FAILED',
            message: 'Shimmy sidecar exited too many times and will not restart automatically.',
            details: { code, signal },
          });
          this.emit('error', exhaustedError);
        }
      }
    });

    child.once('error', (spawnError) => {
      const shimmyError = toShimmyError(spawnError, {
        code: 'START_TIMEOUT',
        message: 'Failed to spawn shimmy process.',
        details: { port },
      });
      this.emit('error', shimmyError);
    });

    await this.waitForHealth(port, options.healthTimeoutMs);

    this.state = 'ready';
    this.restartCount = 0;
    this.emit('ready', { port, startedAt: new Date() });
  }

  protected buildArgs(options: ShimmyProcessOptions, port: number): string[] {
    const args = [...(options.args ?? ['serve'])];

    let hasBindFlag = false;
    for (let index = 0; index < args.length; index += 1) {
      const arg = args[index];
      if (arg === '--bind') {
        hasBindFlag = true;
        if (index + 1 < args.length) {
          args[index + 1] = `${ShimmyProcessDefaults.BIND_HOST}:${port}`;
        } else {
          args.push(`${ShimmyProcessDefaults.BIND_HOST}:${port}`);
        }
        break;
      }
      if (arg.startsWith('--bind=')) {
        args[index] = `--bind=${ShimmyProcessDefaults.BIND_HOST}:${port}`;
        hasBindFlag = true;
        break;
      }
    }

    if (!hasBindFlag) {
      args.push('--bind', `${ShimmyProcessDefaults.BIND_HOST}:${port}`);
    }

    if (options.gpuMode !== 'auto') {
      let hasGpuFlag = false;
      for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg === '--gpu') {
          hasGpuFlag = true;
          if (index + 1 < args.length) {
            args[index + 1] = options.gpuMode;
          } else {
            args.push(options.gpuMode);
          }
          break;
        }
        if (arg.startsWith('--gpu=')) {
          args[index] = `--gpu=${options.gpuMode}`;
          hasGpuFlag = true;
          break;
        }
      }
      if (!hasGpuFlag) {
        args.push('--gpu', options.gpuMode);
      }
    }

    return args;
  }

  protected async findAvailablePort(preferredPort: number, limit: number): Promise<number> {
    for (let offset = 0; offset < limit; offset += 1) {
      const port = preferredPort + offset;
      const available = await this.isPortAvailable(port);
      if (available) {
        return port;
      }
    }

    throw new ShimmyError({
      code: 'PORT_IN_USE',
      message: `No available shimmy port found between ${preferredPort} and ${preferredPort + limit - 1}.`,
    });
  }

  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const server = createServer();
      server.once('error', () => {
        server.close(() => resolve(false));
      });
      server.listen(port, ShimmyProcessDefaults.BIND_HOST, () => {
        server.close(() => resolve(true));
      });
    });
  }

  private async waitForHealth(port: number, timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let lastError: unknown;

    while (Date.now() < deadline) {
      if (!this.isChildAlive()) {
        throw new ShimmyError({
          code: 'START_TIMEOUT',
          message: 'Shimmy process exited before completing health checks.',
          details: { port },
        });
      }

      const result = await this.performHealthCheck(port);
      if (result.ok) {
        return;
      }
      lastError = result.error;

      await delay(ShimmyProcessDefaults.HEALTHCHECK_INTERVAL_MS);
    }

    throw new ShimmyError({
      code: 'START_TIMEOUT',
      message: 'Timed out waiting for shimmy health check.',
      details: {
        port,
        lastError: lastError instanceof Error ? lastError.message : (lastError ?? null),
      },
    });
  }

  private async performHealthCheck(
    port: number
  ): Promise<{ ok: true } | { ok: false; error?: unknown }> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        ShimmyProcessDefaults.HEALTHCHECK_REQUEST_TIMEOUT_MS
      );
      const response = await fetch(`http://${ShimmyProcessDefaults.BIND_HOST}:${port}/v1/models`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });
      clearTimeout(timer);
      if (!response.ok) {
        return { ok: false, error: new Error(`Unexpected status: ${response.status}`) };
      }
      await response.json();
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  private isChildAlive(): boolean {
    return Boolean(
      this.child &&
        this.child.pid !== undefined &&
        this.child.exitCode === null &&
        this.child.signalCode === null
    );
  }

  private async stopChild(): Promise<void> {
    const child = this.child;
    if (!child) {
      this.state = 'idle';
      this.port = null;
      return;
    }

    if (child.exitCode !== null || child.signalCode !== null || child.pid === undefined) {
      this.child = null;
      this.state = 'idle';
      this.port = null;
      return;
    }

    this.state = 'stopping';

    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        this.safeKill(child, 'SIGKILL');
      }, ShimmyProcessDefaults.TERMINATE_GRACE_MS);

      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });

      this.safeKill(child, 'SIGTERM');
    });

    this.child = null;
    this.port = null;
    this.state = 'idle';
  }

  private safeKill(child: ChildProcess, signal: NodeJS.Signals): void {
    if (child.pid === undefined || child.killed) {
      return;
    }

    try {
      child.kill(signal);
    } catch (error) {
      const err = error as NodeJS.ErrnoException | undefined;
      if (err?.code === 'ESRCH') {
        return;
      }
      throw error;
    }
  }

  private async restartAfterExit(): Promise<void> {
    if (!this.keepAlive || !this.options) {
      return;
    }

    try {
      await this.tryStart(this.options);
    } catch (error) {
      const shimmyError = toShimmyError(error, {
        code: 'HEALTHCHECK_FAILED',
        message: 'Failed to restart shimmy after unexpected exit.',
      });
      this.emit('error', shimmyError);
    }
  }
}
