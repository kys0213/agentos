import type { LlmManifest } from 'llm-bridge-spec';

/**
 * Unique identifier for a registered LLM bridge.
 * Default is the manifest.name unless specified otherwise.
 */
export type BridgeId = string;

/**
 * Stored record for an installed LLM bridge.
 * This stores the declarative manifest only (no runtime instance).
 */
export interface InstalledBridgeRecord {
  /** Unique identifier for the bridge (usually equals manifest.name) */
  id: BridgeId;
  /** Original manifest describing the bridge */
  manifest: LlmManifest;
  /** When this bridge was registered */
  installedAt: Date;
  /** Serialized config that was applied when the bridge was registered */
  config?: unknown;
}

/**
 * Lightweight summary of an installed bridge for listing.
 */
export interface InstalledBridgeSummary {
  id: BridgeId;
  name: string;
  description: string;
  language: string;
  configured: boolean;
  available: boolean;
}

/**
 * Active bridge state persisted separately from records.
 */
export interface ActiveBridgeState {
  activeId: BridgeId | null;
  updatedAt: Date;
}

/** Type guards (runtime safety for JSON I/O) */
const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object';

export const isInstalledBridgeRecord = (v: unknown): v is InstalledBridgeRecord => {
  if (!isObject(v)) {
    return false;
  }
  const o = v as Record<string, unknown>;
  const idOk = typeof o.id === 'string';
  const installedAt = o.installedAt;
  const installedAtOk =
    typeof installedAt === 'string' || installedAt instanceof Date || installedAt === undefined;
  const config = o.config;
  const configOk =
    config === undefined ||
    config === null ||
    typeof config === 'boolean' ||
    typeof config === 'number' ||
    typeof config === 'string' ||
    Array.isArray(config) ||
    isObject(config);

  const manifest = o.manifest;
  if (!isObject(manifest)) {
    return false;
  }
  const m = manifest as Record<string, unknown>;
  const manifestOk =
    typeof m.name === 'string' &&
    typeof m.schemaVersion === 'string' &&
    typeof m.language === 'string' &&
    typeof m.entry === 'string' &&
    typeof m.description === 'string';
  return idOk && installedAtOk && manifestOk && configOk;
};

export const isActiveBridgeState = (v: unknown): v is ActiveBridgeState => {
  if (!isObject(v)) {
    return false;
  }
  const o = v as Record<string, unknown>;
  const activeId = o.activeId;
  const updatedAt = o.updatedAt;
  const activeIdOk = activeId === null || typeof activeId === 'string';
  const updatedAtOk = typeof updatedAt === 'string' || updatedAt instanceof Date;
  return activeIdOk && updatedAtOk;
};
