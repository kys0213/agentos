import { z } from 'zod';

const knowledgeStatsSchema = z.object({
  indexed: z.number(),
  vectorized: z.number(),
  totalSize: z.number(),
});

const presetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  author: z.string(),
  createdAt: z.preprocess((v) => (typeof v === 'string' ? new Date(v) : v), z.date()),
  updatedAt: z.preprocess((v) => (typeof v === 'string' ? new Date(v) : v), z.date()),
  version: z.string(),
  systemPrompt: z.string(),
  enabledMcps: z.array(z.unknown()).default([]),
  llmBridgeName: z.string(),
  llmBridgeConfig: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(['active', 'idle', 'inactive']),
  usageCount: z.number().default(0),
  knowledgeDocuments: z.number().default(0),
  knowledgeStats: knowledgeStatsSchema,
  category: z.array(z.string()).default([]),
});

export const agentMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  keywords: z.array(z.string()),
  preset: presetSchema,
  status: z.enum(['active', 'idle', 'inactive']),
});
