const { z } = require('zod');

class E2ELlmBridge {
  constructor(config = {}) {
    this.config = config;
  }

  static manifest() {
    const configSchema = z
      .object({
        model: z.string().default('e2e-mini').optional(),
        temperature: z.number().min(0).max(2).default(0.2).optional(),
      })
      .default({});

    return {
      schemaVersion: '1.0.0',
      name: 'e2e-llm-bridge',
      language: 'javascript',
      entry: 'index.js',
      description: 'Test LLM bridge used for Electron E2E validation',
      configSchema,
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
    };
  }

  async invoke(prompt) {
    const joined = Array.isArray(prompt?.messages)
      ? prompt.messages
          .map((msg) => {
            if (typeof msg === 'string') {
              return msg;
            }
            if (msg && typeof msg.content === 'string') {
              return msg.content;
            }
            if (msg && Array.isArray(msg.content)) {
              return msg.content
                .map((chunk) => (typeof chunk === 'string' ? chunk : chunk?.text ?? ''))
                .join(' ');
            }
            return '';
          })
          .join(' ')
      : '';

    return {
      content: [
        {
          type: 'text',
          text: joined ? `E2E response: ${joined}` : 'E2E response: (empty prompt)',
        },
      ],
      usage: {
        promptTokens: 8,
        completionTokens: 4,
        totalTokens: 12,
      },
    };
  }

  async getMetadata() {
    return {
      name: 'E2E LLM Bridge',
      description: 'Stub bridge shipped for automated Electron E2E tests',
      model: this.config.model ?? 'e2e-mini',
      contextWindow: 2048,
      maxTokens: 512,
    };
  }
}

module.exports = E2ELlmBridge;
module.exports.default = E2ELlmBridge;
