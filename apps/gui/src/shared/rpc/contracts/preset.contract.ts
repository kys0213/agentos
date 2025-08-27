import { z } from 'zod';
import { defineContract } from './defineContract';

export const PresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().default(''),
  author: z.string().optional().default(''),
  version: z.string().optional().default('1.0.0'),
  systemPrompt: z.string().optional().default(''),
  enabledMcps: z.array(z.string()).default([]),
  llmBridgeName: z.string().optional(),
  llmBridgeConfig: z.record(z.unknown()).default({}),
  status: z.string().optional().default('active'),
  category: z.array(z.string()).default(['general']),
  createdAt: z.preprocess((v) => (typeof v === 'string' ? new Date(v) : v), z.date()).optional(),
  updatedAt: z.preprocess((v) => (typeof v === 'string' ? new Date(v) : v), z.date()).optional(),
});

export const CreatePresetSchema = PresetSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial({
  name: false,
  llmBridgeName: false,
  systemPrompt: false,
});

export const PresetSummarySchema = z.object({ id: z.string(), name: z.string() });

export const PresetContract = defineContract({
  namespace: 'preset',
  methods: {
    list: {
      channel: 'preset.list',
      response: z.object({ items: z.array(PresetSummarySchema), nextCursor: z.string().default(''), hasMore: z.boolean().default(false) }),
    },
    get: {
      channel: 'preset.get',
      payload: z.string(),
      response: PresetSchema.nullable(),
    },
    create: {
      channel: 'preset.create',
      payload: CreatePresetSchema,
      response: z.object({ success: z.boolean(), result: PresetSchema.optional(), error: z.string().optional() }),
    },
    update: {
      channel: 'preset.update',
      payload: z.object({ id: z.string(), preset: PresetSchema }),
      response: z.object({ success: z.boolean(), result: PresetSchema.optional(), error: z.string().optional() }),
    },
    delete: {
      channel: 'preset.delete',
      payload: z.string(),
      response: z.object({ success: z.boolean(), error: z.string().optional() }),
    },
  },
});

