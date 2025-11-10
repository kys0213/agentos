import type { ReadonlyPreset } from '@agentos/core';

export function isValidReadonlyPreset(value: unknown): value is ReadonlyPreset {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const preset = value as Partial<ReadonlyPreset>;
  return typeof preset.id === 'string' && typeof preset.name === 'string';
}
