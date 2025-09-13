import { describe, it, expect } from 'vitest';
import type { CreateAgentMetadata, ReadonlyPreset } from '@agentos/core';
import { applyAgentExport, serializeAgent, tryParseAgentExport } from '../agent-export';

const makeAgent = (): CreateAgentMetadata => ({
  name: 'Agent',
  description: 'Desc',
  status: 'active',
  icon: 'icon.png',
  keywords: ['k1', 'k2'],
  // @ts-expect-error partial preset shape for test
  preset: {
    id: 'p1',
    name: 'P1',
    description: 'Pres',
    systemPrompt: 'You are great',
    enabledMcps: ['tool.a'],
    llmBridgeName: 'bridge.x',
    llmBridgeConfig: { key: 'v' },
  } as unknown as ReadonlyPreset,
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
