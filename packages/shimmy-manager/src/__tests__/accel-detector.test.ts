import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DefaultAccelDetector, resolveRequestedGpuMode } from '../accel-detector';
import type { AccelDetectorResult } from '../types';

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(() => ({ status: 1, stdout: '' })),
}));

const mockSpawnSync = vi.mocked(spawnSync);
type SpawnSyncResult = ReturnType<typeof spawnSync>;

describe('DefaultAccelDetector', () => {
  beforeEach(() => {
    mockSpawnSync.mockReturnValue({ status: 1, stdout: '' } as SpawnSyncResult);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('prefers mlx on Apple Silicon', async () => {
    const detector = new DefaultAccelDetector();
    const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
    const archSpy = vi.spyOn(os, 'arch').mockReturnValue('arm64');

    try {
      const result = await detector.detect();
      expect(result).toEqual<AccelDetectorResult>({
        recommended: 'mlx',
        reason: expect.stringContaining('Apple Silicon'),
      });
    } finally {
      platformSpy.mockRestore();
      archSpy.mockRestore();
    }
  });

  it('prefers metal on Intel macOS', async () => {
    const detector = new DefaultAccelDetector();
    const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
    const archSpy = vi.spyOn(os, 'arch').mockReturnValue('x64');

    try {
      const result = await detector.detect();
      expect(result.recommended).toBe('metal');
    } finally {
      platformSpy.mockRestore();
      archSpy.mockRestore();
    }
  });

  it('detects NVIDIA GPUs on Linux', async () => {
    const detector = new DefaultAccelDetector();
    const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
    mockSpawnSync.mockReturnValue({ status: 0, stdout: 'NVIDIA Tesla' } as SpawnSyncResult);

    try {
      const result = await detector.detect();
      expect(result.recommended).toBe('cuda');
      expect(result.reason).toContain('NVIDIA');
    } finally {
      platformSpy.mockRestore();
    }
  });

  it('falls back to OpenCL when ROCm tools are present', async () => {
    const detector = new DefaultAccelDetector();
    const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
    mockSpawnSync.mockImplementation((cmd: string) => {
      if (cmd === 'nvidia-smi') {
        return { status: 1, stdout: '' } as SpawnSyncResult;
      }
      if (cmd === 'rocm-smi') {
        return { status: 0, stdout: 'AMD GPU' } as SpawnSyncResult;
      }
      if (cmd === 'rocminfo') {
        return { status: 0, stdout: 'info' } as SpawnSyncResult;
      }
      return { status: 1, stdout: '' } as SpawnSyncResult;
    });

    try {
      const result = await detector.detect();
      expect(result.recommended).toBe('opencl');
    } finally {
      platformSpy.mockRestore();
    }
  });

  it('falls back to CPU when no accelerator detected', async () => {
    const detector = new DefaultAccelDetector();
    const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
    mockSpawnSync.mockReturnValue({ status: 1, stdout: '' } as SpawnSyncResult);

    try {
      const result = await detector.detect();
      expect(result.recommended).toBe('cpu');
    } finally {
      platformSpy.mockRestore();
    }
  });

  it('returns requested mode when not auto', async () => {
    const detector = new DefaultAccelDetector();
    const mode = await resolveRequestedGpuMode('cuda', detector);
    expect(mode).toBe('cuda');
  });

  it('uses detector when mode is auto', async () => {
    const detector = new DefaultAccelDetector();
    const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
    const archSpy = vi.spyOn(os, 'arch').mockReturnValue('arm64');

    try {
      const mode = await resolveRequestedGpuMode('auto', detector);
      expect(mode).toBe('mlx');
    } finally {
      platformSpy.mockRestore();
      archSpy.mockRestore();
    }
  });
});
