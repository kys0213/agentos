import type { LlmBridge, LlmManifest } from 'llm-bridge-spec';
import type { BridgeLoadResult } from 'llm-bridge-loader';
import { BridgeId, InstalledBridgeSummary } from './types';
import z from 'zod';

/**
 * Read/write registry for installed LLM bridges.
 * This abstraction handles persistence of manifests and active bridge id.
 * It does NOT load or manage runtime LlmBridge instances.
 */
export interface LlmBridgeRegistry {
  /** List summaries for installed bridges. */
  listSummaries(): Promise<InstalledBridgeSummary[]>;

  /** Get stored manifest for a bridge id. */
  getManifest(id: BridgeId): Promise<LlmManifest | null>;

  getBridge(id: BridgeId): Promise<LlmBridge | null>;

  getBridgeOrThrow(id: BridgeId): Promise<LlmBridge>;

  getBridgeByName(name: string): Promise<LlmBridge | null>;

  loadBridge(name: string): Promise<BridgeLoadResult>;

  /** Register a manifest. Returns the persisted id. */
  register(
    manifest: LlmManifest,
    config: z.infer<typeof manifest.configSchema>,
    opts?: { id?: BridgeId }
  ): Promise<BridgeId>;

  /** Unregister a bridge. */
  unregister(id: BridgeId): Promise<void>;

  /** Get the active bridge id (if any). */
  getActiveId(): Promise<BridgeId | null>;
  /** Set the active bridge id, or null to clear. */
  setActiveId(id: BridgeId | null): Promise<void>;
}
