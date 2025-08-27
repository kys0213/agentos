import { z } from 'zod';
import { defineContract } from './defineContract';

// Note: LlmManifest는 외부 스펙이므로 여기서는 구조를 구체화하지 않고 unknown으로 둡니다.
const LlmManifestSchema = z.unknown();

export const BridgeContract = defineContract({
  namespace: 'bridge',
  methods: {
    register: {
      channel: 'bridge.register',
      payload: z.object({ manifest: LlmManifestSchema, config: z.record(z.unknown()).optional(), id: z.string().optional() }),
      response: z.object({ success: z.boolean(), id: z.string().optional(), error: z.string().optional() }),
    },
    unregister: {
      channel: 'bridge.unregister',
      payload: z.string(),
      response: z.object({ success: z.boolean(), error: z.string().optional() }),
    },
    switch: {
      channel: 'bridge.switch',
      payload: z.string(),
      response: z.object({ success: z.boolean(), error: z.string().optional() }),
    },
    'get-current': {
      channel: 'bridge.get-current',
      response: z.object({ id: z.string(), manifest: LlmManifestSchema }).nullable(),
    },
    list: {
      channel: 'bridge.list',
      response: z.array(z.object({ id: z.string() })),
    },
    'get-config': {
      channel: 'bridge.get-config',
      payload: z.string(),
      response: LlmManifestSchema.nullable(),
    },
  },
});

