import type { LlmBridge, LlmBridgePrompt, LlmBridgeResponse, LlmMetadata } from 'llm-bridge-spec';
import type { InvokeOption } from 'llm-bridge-spec';

export class DummyBridge implements LlmBridge {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_config: unknown) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  invoke(_prompt: LlmBridgePrompt, _options?: InvokeOption): Promise<LlmBridgeResponse> {
    throw new Error('Method not implemented.');
  }

  getMetadata(): Promise<LlmMetadata> {
    throw new Error('Method not implemented.');
  }
}
