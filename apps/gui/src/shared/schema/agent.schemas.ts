import { z } from 'zod';

export const agentMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  keywords: z.array(z.string()),
  preset: z.record(z.string(), z.any()),
  status: z.enum(['active', 'idle', 'inactive']),
});
