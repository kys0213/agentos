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
}

/**
 * Lightweight summary of an installed bridge for listing.
 */
export interface InstalledBridgeSummary {
  id: BridgeId;
  name: string;
  description: string;
  language: string;
}

/**
 * Active bridge state persisted separately from records.
 */
export interface ActiveBridgeState {
  activeId: BridgeId | null;
  updatedAt: Date;
}

/** Type guards (runtime safety for JSON I/O) */
export const isInstalledBridgeRecord = (v: unknown): v is InstalledBridgeRecord => {
  if (!v || typeof v !== 'object') return false;
  const o = v as any;
  return (
    typeof o.id === 'string' &&
    o.manifest &&
    typeof o.manifest === 'object' &&
    typeof o.manifest.name === 'string' &&
    typeof o.manifest.schemaVersion === 'string' &&
    typeof o.manifest.language === 'string' &&
    typeof o.manifest.entry === 'string' &&
    typeof o.manifest.description === 'string' &&
    !!o.installedAt
  );
};

export const isActiveBridgeState = (v: unknown): v is ActiveBridgeState => {
  if (!v || typeof v !== 'object') return false;
  const o = v as any;
  return ('activeId' in o && 'updatedAt' in o);
};

