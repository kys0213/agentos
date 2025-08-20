// Minimal mock for 'llm-bridge-loader' used by tests
export type BridgeLoadResult = {
  ctor: new (config: unknown) => unknown;
  mainfest: { name: string; configSchema: { parse: (x: unknown) => unknown } };
};

export class LlmBridgeLoader {
  async load(name: string): Promise<BridgeLoadResult> {
    class DummyBridge {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(_config: unknown) {}
    }
    return {
      ctor: DummyBridge,
      // Note: FileBasedLlmBridgeRegistry expects property name 'mainfest' (typo retained)
      mainfest: {
        name,
        configSchema: { parse: (x: unknown) => x },
      },
    };
  }
}
