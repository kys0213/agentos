import { McpConfig } from "../components/MCPToolAdd";

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  model: string;
  systemPrompt: string;
  parameters: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  tools: string[];
  mcpTools?: McpConfig[];
  status: "active" | "idle" | "inactive";
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  knowledgeDocuments: number;
  knowledgeStats?: {
    indexed: number;
    vectorized: number;
    totalSize: number;
  };
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "active" | "idle" | "inactive";
  preset: string;
  avatar?: string;
  lastUsed?: Date;
  usageCount: number;
  tags?: string[];
}

export interface ChatAgent {
  id: number;
  name: string;
  preset: string;
}

export type AppSection = 
  | "dashboard" 
  | "chat" 
  | "subagents" 
  | "presets" 
  | "models" 
  | "tools" 
  | "toolbuilder" 
  | "racp" 
  | "settings";