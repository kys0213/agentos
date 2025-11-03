import type { FileBasedLlmBridgeRegistry } from '@agentos/core';
import type { BridgeLoadResult, DependencyBridgeLoader } from 'llm-bridge-loader';
import type { LlmManifest } from 'llm-bridge-spec';

type DefaultConfigFactory = (manifest: LlmManifest) => Record<string, unknown>;

const DEFAULT_CONFIG_FACTORIES: Record<string, DefaultConfigFactory> = {
  'ollama-llm-bridge': (manifest) => {
    const firstModel = manifest.models?.[0]?.name ?? 'llama3.2';
    return { model: firstModel };
  },
};

export async function loadBundledBridges(
  registry: FileBasedLlmBridgeRegistry,
  loader: DependencyBridgeLoader,
  cwd: string
): Promise<void> {
  let scanError: unknown;
  let results: BridgeLoadResult<LlmManifest>[] = [];

  try {
    results = await loader.scan({ cwd, includeDev: false });
  } catch (error) {
    console.error('[bridge] 의존성 스캔에 실패했습니다:', error);
    scanError = error;
  }

  const defaultTargets = Object.entries(DEFAULT_CONFIG_FACTORIES);

  if (results.length === 0 && defaultTargets.length > 0) {
    for (const [bridgeName] of defaultTargets) {
      try {
        const loaded = await loader.load(bridgeName);
        results.push(loaded);
      } catch (error) {
        console.error(`[bridge] ${bridgeName} 직접 로딩 실패`, error);
      }
    }
  }

  const manifestByName = new Map<string, LlmManifest>();
  for (const { manifest } of results) {
    manifestByName.set(manifest.name, manifest);
    try {
      await registry.ensureManifestRecord(manifest, { id: manifest.name });
    } catch (error) {
      console.error(`[bridge] ${manifest.name} 매니페스트 저장 실패`, error);
    }
  }

  if (defaultTargets.length === 0) {
    return;
  }

  let summaries: Awaited<ReturnType<FileBasedLlmBridgeRegistry['listSummaries']>> = [];
  try {
    summaries = await registry.listSummaries();
  } catch (error) {
    if (!scanError) {
      console.error('[bridge] 번들 브리지 요약 조회 실패', error);
    }
    return;
  }

  for (const [bridgeName, factory] of defaultTargets) {
    const summary = summaries.find((item) => item.id === bridgeName);
    if (summary?.configured) {
      continue;
    }
    if (!summary) {
      try {
        const existing = await registry.getBridge(bridgeName);
        if (existing) {
          continue;
        }
      } catch {
        // ignore check errors and attempt default registration below
      }
    }

    let manifest = manifestByName.get(bridgeName);
    if (!manifest) {
      manifest = (await registry.getManifest(bridgeName)) ?? undefined;
    }
    if (!manifest) {
      continue;
    }

    try {
      const config = factory(manifest);
      await registry.register(manifest, config, { id: bridgeName });
    } catch (error) {
      console.error(`[bridge] ${bridgeName} 기본 설정 등록 실패`, error);
    }
  }
}
