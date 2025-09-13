import type { CreateAgentMetadata, ReadonlyPreset } from '@agentos/core';

export type AgentExport = {
  name: string;
  description: string;
  status: 'active' | 'idle' | 'inactive';
  icon?: string;
  keywords: string[];
  preset: Pick<ReadonlyPreset, 'name' | 'description' | 'systemPrompt' | 'enabledMcps' | 'llmBridgeName' | 'llmBridgeConfig'>;
};

export function serializeAgent(agent: CreateAgentMetadata): AgentExport {
  if (!agent.preset) {
    throw new Error('Preset is required for export');
  }
  const { name, description, status, icon, keywords, preset } = agent;
  return {
    name,
    description,
    status,
    icon,
    keywords: keywords ?? [],
    preset: {
      name: preset.name,
      description: preset.description,
      systemPrompt: preset.systemPrompt ?? '',
      enabledMcps: (preset as any).enabledMcps ?? [],
      llmBridgeName: preset.llmBridgeName,
      llmBridgeConfig: preset.llmBridgeConfig ?? {},
    },
  };
}

export function tryParseAgentExport(jsonText: string): AgentExport | null {
  try {
    const obj = JSON.parse(jsonText);
    if (
      obj &&
      typeof obj.name === 'string' &&
      typeof obj.description === 'string' &&
      (obj.status === 'active' || obj.status === 'idle' || obj.status === 'inactive') &&
      obj.preset &&
      typeof obj.preset.name === 'string'
    ) {
      return obj as AgentExport;
    }
    return null;
  } catch {
    return null;
  }
}

export function applyAgentExport(
  current: Partial<CreateAgentMetadata>,
  data: AgentExport
): Partial<CreateAgentMetadata> {
  const updated: Partial<CreateAgentMetadata> = {
    ...current,
    name: data.name,
    description: data.description,
    status: data.status,
    icon: data.icon,
    keywords: data.keywords ?? [],
    preset: current.preset
      ? { ...current.preset, ...data.preset }
      : (data.preset as unknown as ReadonlyPreset),
  };
  return updated;
}
