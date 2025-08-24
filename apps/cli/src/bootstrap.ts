import { ChatManager } from '@agentos/core';
import { createManager } from './chat-manager';
import { DependencyBridgeLoader } from 'llm-bridge-loader';
import { LlmBridge } from 'llm-bridge-spec';

export interface AppContext {
  chatManager: ChatManager;
  llmBridge: LlmBridge;
}

let context: AppContext | null = null;

function safeParseJson<T>(input: string | undefined): T | undefined {
  if (!input) {
    return undefined;
  }
  try {
    return JSON.parse(input) as T;
  } catch (err) {
    throw new Error(`Invalid JSON in LLM_BRIDGE_CONFIG: ${(err as Error).message}`);
  }
}

async function createBridge(): Promise<LlmBridge> {
  const moduleName = process.env.LLM_BRIDGE ?? '';
  if (!moduleName) {
    throw new Error('LLM_BRIDGE env var is required to bootstrap the CLI');
  }

  const config = safeParseJson<Record<string, unknown>>(process.env.LLM_BRIDGE_CONFIG) ?? {};
  const loader = new DependencyBridgeLoader();
  const { ctor, manifest } = await loader.load(moduleName);
  const schema = (manifest as unknown as { configSchema: { parse: (x: unknown) => unknown } })
    .configSchema;
  return new ctor(schema.parse(config));
}

export async function bootstrap(): Promise<AppContext> {
  if (!context) {
    const bridge = await createBridge();
    const chatManager = createManager(bridge);
    context = { chatManager, llmBridge: bridge };
  }
  return context;
}
