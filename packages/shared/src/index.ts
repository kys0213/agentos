// Shared types and utilities
export interface AgentConfig {
  name: string;
  version: string;
  description?: string;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
}

// Add more shared types and utilities as needed
