import { ChatManager } from '@agentos/core';
import { createManager } from './chat-manager';
import { DependencyBridgeLoader } from 'llm-bridge-loader';
import { LlmBridge } from 'llm-bridge-spec';

export interface AppContext {
  chatManager: ChatManager;
  llmBridge: LlmBridge;
}

let context: AppContext | null = null;

async function createBridge(): Promise<LlmBridge> {
  const moduleName = process.env.LLM_BRIDGE ?? '';
  const configEnv = process.env.LLM_BRIDGE_CONFIG;
  const loader = new DependencyBridgeLoader();
  const bootstrap = await loader.load(moduleName);
  const config = configEnv ? JSON.parse(configEnv) : {};
  return bootstrap.create(config);
}

export async function bootstrap(): Promise<AppContext> {
  if (!context) {
    const bridge = await createBridge();
    const chatManager = createManager(bridge);
    context = { chatManager, llmBridge: bridge };
  }
  return context;
}
