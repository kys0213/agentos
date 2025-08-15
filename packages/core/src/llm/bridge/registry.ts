import path from 'path';
import { fs } from '@agentos/lang';
import type { LlmManifest } from 'llm-bridge-spec';
import {
  ActiveBridgeState,
  BridgeId,
  InstalledBridgeRecord,
  InstalledBridgeSummary,
  isActiveBridgeState,
  isInstalledBridgeRecord,
} from './types';

/**
 * Read/write registry for installed LLM bridges.
 * This abstraction handles persistence of manifests and active bridge id.
 * It does NOT load or manage runtime LlmBridge instances.
 */
export interface LlmBridgeRegistry {
  /** List all installed bridge ids. */
  listIds(): Promise<BridgeId[]>;
  /** List summaries for installed bridges. */
  listSummaries(): Promise<InstalledBridgeSummary[]>;
  /** Get stored manifest for a bridge id. */
  getManifest(id: BridgeId): Promise<LlmManifest | null>;

  /** Register a manifest. Returns the persisted id. */
  register(manifest: LlmManifest, opts?: { id?: BridgeId }): Promise<BridgeId>;
  /** Unregister a bridge. */
  unregister(id: BridgeId): Promise<void>;

  /** Get the active bridge id (if any). */
  getActiveId(): Promise<BridgeId | null>;
  /** Set the active bridge id, or null to clear. */
  setActiveId(id: BridgeId | null): Promise<void>;
}

/**
 * File-based registry implementation.
 * - Stores each bridge record as `${baseDir}/bridges/<id>.json`
 * - Stores active id as `${baseDir}/bridges/_active.json`
 */
export class FileBasedLlmBridgeRegistry implements LlmBridgeRegistry {
  private readonly bridgesDir: string;
  private readonly activePath: string;

  constructor(private readonly baseDir: string) {
    this.bridgesDir = path.join(baseDir, 'bridges');
    this.activePath = path.join(this.bridgesDir, '_active.json');
  }

  async listIds(): Promise<BridgeId[]> {
    await fs.FileUtils.ensureDir(this.bridgesDir);
    const entries = await fs.FileUtils.readDir(this.bridgesDir);
    if (!entries.success) return [];
    return entries.result
      .filter((f) => f.endsWith('.json') && !f.startsWith('_active'))
      .map((f) => f.replace(/\.json$/, ''));
  }

  async listSummaries(): Promise<InstalledBridgeSummary[]> {
    const ids = await this.listIds();
    const items: InstalledBridgeSummary[] = [];
    for (const id of ids) {
      const rec = await this.readRecord(id);
      if (!rec) continue;
      items.push({
        id: rec.id,
        name: rec.manifest.name,
        description: rec.manifest.description,
        language: rec.manifest.language,
      });
    }
    return items;
  }

  async getManifest(id: BridgeId): Promise<LlmManifest | null> {
    const rec = await this.readRecord(id);
    return rec?.manifest ?? null;
  }

  async register(manifest: LlmManifest, opts?: { id?: BridgeId }): Promise<BridgeId> {
    const id = opts?.id ?? manifest.name;
    const record: InstalledBridgeRecord = {
      id,
      manifest,
      installedAt: new Date(),
    };
    await this.writeRecord(record);

    // If no active id yet, set to this id
    const active = await this.getActiveId();
    if (!active) await this.setActiveId(id);
    return id;
  }

  async unregister(id: BridgeId): Promise<void> {
    const filePath = this.recordPath(id);
    await fs.FileUtils.remove(filePath);

    // If active, switch to first remaining or clear
    const active = await this.getActiveId();
    if (active === id) {
      const remaining = (await this.listIds()).filter((x) => x !== id);
      await this.setActiveId(remaining[0] ?? null);
    }
  }

  async getActiveId(): Promise<BridgeId | null> {
    const handler = fs.JsonFileHandler.create<ActiveBridgeState>(
      this.activePath,
      isActiveBridgeState,
      { activeId: null, updatedAt: new Date() }
    );
    const res = await handler.read({ useDefaultOnError: true, reviveDates: true });
    return res.success ? (res.result.activeId as BridgeId | null) : null;
  }

  async setActiveId(id: BridgeId | null): Promise<void> {
    const handler = fs.JsonFileHandler.create<ActiveBridgeState>(
      this.activePath,
      isActiveBridgeState,
      { activeId: null, updatedAt: new Date() }
    );
    const data: ActiveBridgeState = { activeId: id, updatedAt: new Date() };
    const res = await handler.write(data, { prettyPrint: true, indent: 2, ensureDir: true });
    if (!res.success) throw new Error(`Failed to set active bridge: ${String(res.reason)}`);
  }

  // ---------- helpers ----------
  private recordPath(id: BridgeId): string {
    return path.join(this.bridgesDir, `${id}.json`);
  }

  private async readRecord(id: BridgeId): Promise<InstalledBridgeRecord | null> {
    const handler = fs.JsonFileHandler.create<InstalledBridgeRecord>(
      this.recordPath(id),
      isInstalledBridgeRecord
    );
    const res = await handler.read({ useDefaultOnError: false, reviveDates: true });
    if (!res.success) return null;
    const rec = res.result;
    // Ensure Date object
    return { ...rec, installedAt: new Date(rec.installedAt) };
  }

  private async writeRecord(record: InstalledBridgeRecord): Promise<void> {
    const handler = fs.JsonFileHandler.create<InstalledBridgeRecord>(
      this.recordPath(record.id),
      isInstalledBridgeRecord
    );
    const res = await handler.write(record, { prettyPrint: true, indent: 2, ensureDir: true });
    if (!res.success) throw new Error(`Failed to save bridge record: ${String(res.reason)}`);
  }
}
