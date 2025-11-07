import type { ShimmyError } from './errors';

export type ShimmyGpuMode = 'auto' | 'cpu' | 'cuda' | 'metal' | 'mlx' | 'opencl';

export interface ShimmyProcessOptions {
  shimmyPath: string;
  preferredPort: number;
  modelsDir: string;
  args?: string[];
  gpuMode: ShimmyGpuMode;
  healthTimeoutMs: number;
  env?: NodeJS.ProcessEnv;
  maxRestarts?: number;
  portRetryLimit?: number;
}

export type ShimmyProcessState = 'idle' | 'starting' | 'ready' | 'stopping';

export interface ShimmyProcessManagerEvents {
  starting: { port: number; attempt: number };
  ready: { port: number; startedAt: Date };
  restarting: { attempt: number; error: ShimmyError };
  stopped: { code: number | null; signal: NodeJS.Signals | null };
  stdout: string;
  stderr: string;
  error: ShimmyError;
}

export type ShimmyProcessEvent = keyof ShimmyProcessManagerEvents;

export type ShimmyProcessEventListener<Event extends ShimmyProcessEvent> = (
  payload: ShimmyProcessManagerEvents[Event]
) => void;

export interface ShimmyProcessManager {
  start(options: ShimmyProcessOptions): Promise<void>;
  ensureReady(timeoutMs?: number): Promise<void>;
  stop(): Promise<void>;
  getPort(): number | null;
  getState(): ShimmyProcessState;
  on<Event extends ShimmyProcessEvent>(
    event: Event,
    listener: ShimmyProcessEventListener<Event>
  ): this;
  once<Event extends ShimmyProcessEvent>(
    event: Event,
    listener: ShimmyProcessEventListener<Event>
  ): this;
  off<Event extends ShimmyProcessEvent>(
    event: Event,
    listener: ShimmyProcessEventListener<Event>
  ): this;
}

export interface AccelDetectorResult {
  recommended: Exclude<ShimmyGpuMode, 'auto'>;
  reason: string;
}

export interface ShimmyModelSummary {
  id: string;
  isDefault: boolean;
  path?: string;
  sizeBytes?: number;
  description?: string;
}

export type ShimmyDownloadHandler = (modelId: string, targetDir: string) => Promise<void>;

export interface ShimmyModelRegistry {
  listLocal(): Promise<ShimmyModelSummary[]>;
  ensureDefault(modelId: string, handler: ShimmyDownloadHandler): Promise<void>;
}

export interface ShimmyModelRegistryOptions {
  shimmyPath: string;
  modelsDir: string;
}

export interface AccelDetector {
  detect(): Promise<AccelDetectorResult>;
}
