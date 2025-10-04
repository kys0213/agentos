import { z } from 'zod';
import type {
  LlmBridge,
  LlmBridgePrompt,
  LlmBridgeResponse,
  Message,
  MultiModalContent,
} from 'llm-bridge-spec';

const ConfigSchema = z
  .object({
    model: z.string().default('e2e-mini').optional(),
    temperature: z.number().min(0).max(2).default(0.2).optional(),
  })
  .default({});

type BridgeConfig = z.infer<typeof ConfigSchema>;

const DEFAULT_USAGE = {
  promptTokens: 8,
  completionTokens: 4,
  totalTokens: 12,
} as const;

function coerceToString(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function createLegacyTextContent(value: string): MultiModalContent {
  const base = { contentType: 'text', value };
  return Object.assign(base, { text: value, type: 'text' }) as MultiModalContent;
}

function extractTextFromContent(content: unknown): string | null {
  if (!content) {
    return null;
  }

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    // Older tests occasionally wrap chunks in nested arrays.
    for (const chunk of content) {
      const maybe = extractTextFromContent(chunk);
      if (maybe) {
        return maybe;
      }
    }
    return null;
  }

  if (typeof content === 'object') {
    const maybeText =
      'text' in content && typeof (content as { text?: unknown }).text === 'string'
        ? (content as { text: string }).text
        : null;

    if (maybeText) {
      return maybeText;
    }

    if ('value' in content) {
      const maybe = coerceToString((content as { value?: unknown }).value);
      if (maybe) {
        return maybe;
      }
    }

    if ('content' in content) {
      const maybe = coerceToString((content as { content?: unknown }).content);
      if (maybe) {
        return maybe;
      }
    }

    if ('text' in content && typeof (content as { text?: unknown }).text === 'string') {
      return (content as { text: string }).text;
    }

    if ('contentType' in content && (content as MultiModalContent).contentType === 'text') {
      return coerceToString((content as MultiModalContent).value);
    }
  }

  return null;
}

function extractPromptText(messages: ReadonlyArray<Message> | undefined): string {
  if (!Array.isArray(messages)) {
    return '';
  }

  const pieces: string[] = [];

  for (const message of messages) {
    if (!message || !Array.isArray(message.content)) {
      continue;
    }

    for (const chunk of message.content) {
      const maybe = extractTextFromContent(chunk);
      if (maybe) {
        pieces.push(maybe);
      }
    }
  }

  return pieces.join(' ').trim();
}

class E2ELlmBridge implements LlmBridge {
  private readonly config: BridgeConfig;

  constructor(config: BridgeConfig = {}) {
    this.config = ConfigSchema.parse(config);
  }

  static manifest() {
    return {
      schemaVersion: '1.0.0',
      name: 'e2e-llm-bridge',
      language: 'typescript',
      entry: 'dist/index.js',
      description: 'Type-safe LLM bridge used for Electron E2E validation',
      configSchema: ConfigSchema,
      capabilities: {
        modalities: ['text'],
        supportsToolCall: false,
        supportsFunctionCall: false,
        supportsMultiTurn: false,
        supportsStreaming: false,
        supportsVision: false,
      },
      models: [
        {
          name: 'e2e-mini',
          contextWindowTokens: 2048,
          pricing: {
            unit: 0,
            currency: 'USD',
            prompt: 0,
            completion: 0,
          },
        },
      ],
    } as const;
  }

  async invoke(prompt: LlmBridgePrompt): Promise<LlmBridgeResponse> {
    const flattened = extractPromptText(prompt?.messages);
    const text = flattened ? `E2E response: ${flattened}` : 'E2E response: (empty prompt)';

    return {
      content: createLegacyTextContent(text),
      usage: { ...DEFAULT_USAGE },
    };
  }

  async getMetadata() {
    return {
      name: 'E2E LLM Bridge',
      description: 'Stub bridge shipped for automated Electron E2E tests',
      model: this.config.model ?? 'e2e-mini',
      contextWindow: 2048,
      maxTokens: 512,
    } as const;
  }
}

export default E2ELlmBridge;
export { E2ELlmBridge };
