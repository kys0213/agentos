import { LlmBridge } from '@agentos/llm-bridge-spec';

export class LlmBridgeLoader {
  static async load(name: string): Promise<LlmBridge> {
    const manifest = await import(`../manifest/${name}.json`);
    const bridge = await import(`../bridges/${name}`);
    return bridge.default;
  }
}
