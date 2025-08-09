export type PresetStatus = 'active' | 'idle' | 'inactive';

export interface Preset {
  id: string;
  name: string;
  description: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  systemPrompt: string;
  enabledMcps?: EnabledMcp[];
  llmBridgeName: string;
  llmBridgeConfig: Record<string, any>;
  status: PresetStatus;
  usageCount: number;
  knowledgeDocuments: number;
  knowledgeStats: KnowledgeState;
  category: string[];
}

export type ReadonlyPreset = Readonly<Preset>;

export type KnowledgeState = {
  indexed: number;
  vectorized: number;
  totalSize: number; // in bytes
};

export interface EnabledMcp {
  name: string;
  version?: string;
  enabledTools: string[];
  enabledResources: string[];
  enabledPrompts: string[];
}
