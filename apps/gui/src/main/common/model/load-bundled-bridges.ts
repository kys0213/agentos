import type { FileBasedLlmBridgeRegistry } from '@agentos/core';
import type { BridgeLoadResult, DependencyBridgeLoader } from 'llm-bridge-loader';
import type { LlmManifest } from 'llm-bridge-spec';

const DEFAULT_CONFIGS: Record<string, () => unknown> = {
  'ollama-llm-bridge': () => ({ model: 'llama3.2' }),
  'openai-llm-bridge': () => ({ apiKey: '', model: 'gpt-4o-mini' }),
  'anthropic-llm-bridge': () => ({ apiKey: '', model: 'claude-sonnet-4' }),
  'xai-grok-llm-bridge': () => ({ apiKey: '', model: 'grok-3-latest' }),
};

export async function loadBundledBridges(
  registry: FileBasedLlmBridgeRegistry,
  loader: DependencyBridgeLoader,
  cwd: string
): Promise<void> {
  let results: BridgeLoadResult<LlmManifest>[];

  try {
    results = await loader.scan({ cwd, includeDev: false });
  } catch (error) {
    console.error('[bridge] 의존성 스캔에 실패했습니다:', error);
    return;
  }

  for (const { manifest } of results) {
    const exists = await registry.getManifest(manifest.name);
    if (exists) {
      continue;
    }

    const config = buildDefaultConfig(manifest.name);

    try {
      await registry.register(manifest, config, { id: manifest.name });
    } catch (error) {
      console.error(`[bridge] ${manifest.name} 등록 실패`, error);
    }
  }
}

function buildDefaultConfig(bridgeName: string): Record<string, unknown> {
  const factory = DEFAULT_CONFIGS[bridgeName];
  if (!factory) {
    return {};
  }
  return factory() as Record<string, unknown>;
}
