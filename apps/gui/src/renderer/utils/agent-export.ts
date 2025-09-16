import type { CreateAgentMetadata, ReadonlyPreset } from '@agentos/core';

export type AgentExport = {
  name: string;
  description: string;
  status: 'active' | 'idle' | 'inactive';
  icon?: string;
  keywords: string[];
  preset: Pick<
    ReadonlyPreset,
    'name' | 'description' | 'systemPrompt' | 'enabledMcps' | 'llmBridgeName' | 'llmBridgeConfig'
  >;
};

export function serializeAgent(agent: CreateAgentMetadata): AgentExport {
  if (!agent.preset) {
    throw new Error('Preset is required for export');
  }
  const { name, description, status, icon, keywords, preset } = agent;
  const safeStatus: AgentExport['status'] =
    status === 'active' || status === 'idle' || status === 'inactive' ? status : 'inactive';
  return {
    name,
    description,
    status: safeStatus,
    icon,
    keywords: keywords ? Array.from(keywords) : [],
    preset: {
      name: preset.name,
      description: preset.description,
      systemPrompt: preset.systemPrompt ?? '',
      enabledMcps: preset.enabledMcps ?? [],
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

function fulfillPresetFromExport(p: AgentExport['preset']): ReadonlyPreset {
  return {
    id: `imported_${Math.random().toString(36).slice(2, 8)}`,
    name: p.name,
    description: p.description,
    author: 'import',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '0',
    systemPrompt: p.systemPrompt ?? '',
    enabledMcps: p.enabledMcps ?? [],
    llmBridgeName: p.llmBridgeName,
    llmBridgeConfig: p.llmBridgeConfig ?? {},
    status: 'active',
    usageCount: 0,
    knowledgeDocuments: 0,
    knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    category: [],
  } as const;
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
      : fulfillPresetFromExport(data.preset),
  };
  return updated;
}
