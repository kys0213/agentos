import { spawnSync } from 'node:child_process';
import os from 'node:os';

import type { AccelDetector, AccelDetectorResult, ShimmyGpuMode } from './types';

const NVIDIA_SMI_BINARY = 'nvidia-smi';
const ROCM_SMI_BINARY = 'rocm-smi';

const normalizeReason = (reason: string): string => reason.replace(/\s+/g, ' ').trim();

const hasExecutable = (binary: string): boolean => {
  const result = spawnSync(binary, ['--help'], { stdio: 'ignore' });
  return result.status === 0;
};

const detectNvidia = (): boolean => {
  const result = spawnSync(NVIDIA_SMI_BINARY, ['--query-gpu=name', '--format=csv,noheader'], {
    encoding: 'utf8',
  });
  return result.status === 0 && Boolean(result.stdout?.trim());
};

const detectRocm = (): boolean => {
  const result = spawnSync(ROCM_SMI_BINARY, ['--showproductname'], {
    encoding: 'utf8',
  });
  return result.status === 0 && Boolean(result.stdout?.trim());
};

const detectMetalOrMlx = (): AccelDetectorResult => {
  const arch = os.arch();
  if (arch === 'arm64') {
    return {
      recommended: 'mlx',
      reason: 'Apple Silicon detected (arm64).',
    };
  }
  return {
    recommended: 'metal',
    reason: 'macOS detected; defaulting to Metal backend.',
  };
};

export class DefaultAccelDetector implements AccelDetector {
  async detect(): Promise<AccelDetectorResult> {
    const platform = process.platform;

    if (platform === 'darwin') {
      const result = detectMetalOrMlx();
      return { recommended: result.recommended, reason: normalizeReason(result.reason) };
    }

    if (platform === 'linux' || platform === 'win32') {
      if (detectNvidia()) {
        return {
          recommended: 'cuda',
          reason: 'Detected NVIDIA GPU via nvidia-smi.',
        };
      }

      if (platform === 'linux' && (detectRocm() || hasExecutable('rocminfo'))) {
        return {
          recommended: 'opencl',
          reason: 'Detected ROCm tooling; defaulting to OpenCL.',
        };
      }

      return {
        recommended: 'cpu',
        reason: normalizeReason('No NVIDIA or ROCm-compatible accelerator detected.'),
      };
    }

    return {
      recommended: 'cpu',
      reason: normalizeReason(`Unsupported platform (${platform}); falling back to CPU.`),
    };
  }
}

export const resolveRequestedGpuMode = async (
  requested: ShimmyGpuMode,
  detector: AccelDetector
): Promise<Exclude<ShimmyGpuMode, 'auto'>> => {
  if (requested !== 'auto') {
    return requested;
  }
  const result = await detector.detect();
  return result.recommended;
};
