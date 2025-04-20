export interface Preset {
  name: string;
  description: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  systemPrompt: string;
  mcpConfig: Record<string, any>;
}
