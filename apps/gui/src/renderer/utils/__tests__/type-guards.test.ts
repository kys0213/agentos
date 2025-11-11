import { describe, it, expect } from 'vitest';
import type { ReadonlyPreset } from '@agentos/core';
import { isValidReadonlyPreset } from '../type-guards';

const buildPreset = (): ReadonlyPreset =>
  ({
    id: 'preset-1',
    name: 'Preset',
    description: 'desc',
    author: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
    systemPrompt: 'prompt',
    enabledMcps: [],
    llmBridgeName: 'bridge',
    llmBridgeConfig: {},
    status: 'active',
    usageCount: 0,
    knowledgeDocuments: 0,
    knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    category: [],
  }) as ReadonlyPreset;

describe('isValidReadonlyPreset', () => {
  it('returns true for objects that look like ReadonlyPreset', () => {
    expect(isValidReadonlyPreset(buildPreset())).toBe(true);
  });

  it('returns false for nullish values', () => {
    expect(isValidReadonlyPreset(null)).toBe(false);
    expect(isValidReadonlyPreset(undefined)).toBe(false);
  });

  it('returns false when required fields are missing or invalid', () => {
    expect(isValidReadonlyPreset({ id: 1, name: 'Preset' })).toBe(false);
    expect(isValidReadonlyPreset({ id: 'foo' })).toBe(false);
  });
});
