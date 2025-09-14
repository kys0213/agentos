import { describe, it, expect } from 'vitest';
import type { CreateAgentMetadata, ReadonlyPreset, EnabledMcp } from '@agentos/core';
import { applyAgentExport, serializeAgent, tryParseAgentExport } from '../agent-export';

function makePreset(): ReadonlyPreset {
  const enabledMcps: EnabledMcp[] = [
    { name: 'tool.a', enabledTools: [], enabledResources: [], enabledPrompts: [] },
  ];
  return {
    id: 'p1',
    name: 'P1',
    description: 'Pres',
    author: 'tester',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1',
    systemPrompt: 'You are great',
    enabledMcps,
    llmBridgeName: 'bridge.x',
    llmBridgeConfig: { key: 'v' },
    status: 'active',
    usageCount: 0,
    knowledgeDocuments: 0,
    knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    category: [],
  } as const;
}

const makeAgent = (): CreateAgentMetadata => ({
  name: 'Agent',
  description: 'Desc',
  status: 'active',
  icon: 'icon.png',
  keywords: ['k1', 'k2'],
  preset: makePreset(),
});

describe('agent-export utils', () => {
  it('serializes and parses agent export json', () => {
    const agent = makeAgent();
    const exp = serializeAgent(agent);
    const text = JSON.stringify(exp);
    const round = tryParseAgentExport(text);
    expect(round).toBeTruthy();
    expect(round?.name).toBe(agent.name);
    expect(round?.preset.systemPrompt).toBe('You are great');
  });

  it('applies import data onto formData', () => {
    const base: Partial<CreateAgentMetadata> = { name: 'Old' };
    const data = serializeAgent(makeAgent());
    const applied = applyAgentExport(base, data);
    expect(applied.name).toBe('Agent');
    expect(applied.preset?.llmBridgeName).toBe('bridge.x');
  });
});
