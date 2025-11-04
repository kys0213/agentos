import * as fs from '@agentos/lang/fs';
import type { BridgeLoadResult, BridgeLoader } from 'llm-bridge-loader';
import type { LlmBridge, LlmManifest } from 'llm-bridge-spec';
import path from 'path';
import z from 'zod/v4/classic/external.cjs';
import { Errors } from '../../../common/error/core-error';
import { LlmBridgeRegistry } from '../registry';
import {
  BridgeId,
  InstalledBridgeSummary,
  InstalledBridgeRecord,
  ActiveBridgeState,
  isActiveBridgeState,
  isInstalledBridgeRecord,
} from '../types';

type BridgeConstructor<Cfg> = new (config: Cfg) => LlmBridge;
type BridgeConstructorWithFactory<Cfg> = BridgeConstructor<Cfg> & {
  create?: (cfg: Cfg) => LlmBridge;
};

/**
 * File-based registry implementation.
 * - Stores each bridge record as `${baseDir}/bridges/<id>.json`
 * - Stores active id as `${baseDir}/bridges/_active.json`
 */

export class FileBasedLlmBridgeRegistry implements LlmBridgeRegistry {
  private readonly bridgesDir: string;
  private readonly activePath: string;

  private readonly loadedBridges = new Map<string, BridgeLoadResult<LlmManifest>>();
  private readonly createdBridges = new Map<BridgeId, LlmBridge>();

  constructor(
    baseDir: string,
    private readonly llmBridgeLoader: BridgeLoader
  ) {
    this.bridgesDir = path.join(baseDir, 'bridges');
    this.activePath = path.join(this.bridgesDir, '_active.json');
  }

  async getBridgeOrThrow(id: BridgeId): Promise<LlmBridge> {
    const bridge = await this.getBridge(id);

    if (!bridge) {
      throw Errors.notFound('llm_bridge', `Bridge ${id} not found`);
    }

    return bridge;
  }

  async getBridgeByName(name: string): Promise<LlmBridge | null> {
    const summaries = await this.listSummaries();

    const summary = summaries.find((s) => s.name === name);

    if (!summary) {
      return null;
    }

    return await this.ensureBridgeInstance(summary.id);
  }

  async loadBridge(name: string): Promise<BridgeLoadResult<LlmManifest>> {
    const result = await this.llmBridgeLoader.load(name);
    // Store raw result keyed by manifest name
    this.loadedBridges.set(result.manifest.name, result);
    return result;
  }

  async listIds(): Promise<BridgeId[]> {
    await fs.FileUtils.ensureDir(this.bridgesDir);
    const entries = await fs.FileUtils.readDir(this.bridgesDir);
    if (!entries.success) {
      return [];
    }
    return entries.result
      .filter((f) => f.endsWith('.json') && !f.startsWith('_active'))
      .map((f) => f.replace(/\.json$/, ''));
  }

  async listSummaries(): Promise<InstalledBridgeSummary[]> {
    const ids = await this.listIds();
    const items: InstalledBridgeSummary[] = [];
    for (const id of ids) {
      const rec = await this.readRecord(id);
      if (!rec) {
        continue;
      }
      const available = await this.ensureDependencyAvailable(rec.manifest.name);
      if (!available) {
        // Skip summaries whose underlying package is no longer installed
        continue;
      }
      items.push({
        id: rec.id,
        name: rec.manifest.name,
        description: rec.manifest.description,
        language: rec.manifest.language,
        configured: rec.config !== undefined,
        available,
      });
    }
    return items;
  }

  async getManifest(id: BridgeId): Promise<LlmManifest | null> {
    const rec = await this.readRecord(id);
    return rec?.manifest ?? null;
  }

  async getBridge(id: BridgeId): Promise<LlmBridge | null> {
    return await this.ensureBridgeInstance(id);
  }

  /**
   * Persist a manifest without instantiating a bridge.
   * Useful for bootstrap flows where configuration will be provided later.
   * Returns the id that was used (existing or newly written).
   */
  async ensureManifestRecord(manifest: LlmManifest, opts?: { id?: BridgeId }): Promise<BridgeId> {
    const targetId = opts?.id ?? manifest.name;

    const existingById = await this.readRecord(targetId);
    if (existingById) {
      return targetId;
    }

    const ids = await this.listIds();
    for (const id of ids) {
      const record = await this.readRecord(id);
      if (record?.manifest.name === manifest.name) {
        return record.id;
      }
    }

    const record: InstalledBridgeRecord = {
      id: targetId,
      manifest,
      installedAt: new Date(),
      config: undefined,
    };

    await this.writeRecord(record);
    return targetId;
  }

  async register(
    manifest: LlmManifest,
    config: z.infer<typeof manifest.configSchema>,
    opts?: { id?: BridgeId }
  ): Promise<BridgeId> {
    const id = opts?.id ?? manifest.name;

    let loadedResult = this.loadedBridges.get(manifest.name);

    if (!loadedResult) {
      loadedResult = await this.llmBridgeLoader.load(manifest.name);
      this.loadedBridges.set(loadedResult.manifest.name, loadedResult);
    }

    const { ctor, manifest: loadedManifest } = loadedResult;
    const parsedConfig = loadedManifest.configSchema.parse(config ?? {});

    const typedCtor: BridgeConstructorWithFactory<typeof parsedConfig> =
      ctor as BridgeConstructorWithFactory<typeof parsedConfig>;

    const bridge =
      typeof typedCtor.create === 'function'
        ? typedCtor.create(parsedConfig)
        : new typedCtor(parsedConfig);

    this.createdBridges.set(id, bridge);

    const record: InstalledBridgeRecord = {
      id,
      manifest,
      installedAt: new Date(),
      config: this.toSerializableConfig(parsedConfig),
    };

    await this.writeRecord(record);

    // If no active id yet, set to this id
    const active = await this.getActiveId();

    if (!active) {
      await this.setActiveId(id);
    }

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
    if (!res.success) {
      throw new Error(`Failed to set active bridge: ${String(res.reason)}`);
    }
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
    if (!res.success) {
      return null;
    }
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
    if (!res.success) {
      throw new Error(`Failed to save bridge record: ${String(res.reason)}`);
    }
  }

  private toSerializableConfig<T>(config: T): T {
    try {
      return JSON.parse(JSON.stringify(config)) as T;
    } catch {
      return config;
    }
  }

  private async ensureBridgeInstance(
    id: BridgeId,
    record?: InstalledBridgeRecord
  ): Promise<LlmBridge | null> {
    const existing = this.createdBridges.get(id);
    if (existing) {
      return existing;
    }

    const rec = record ?? (await this.readRecord(id));
    if (!rec) {
      return null;
    }

    try {
      const loaded = await this.llmBridgeLoader.load(rec.manifest.name);
      this.loadedBridges.set(loaded.manifest.name, loaded);

      const parsedConfig = loaded.manifest.configSchema.parse(rec.config ?? {});
      const typedCtor: BridgeConstructorWithFactory<typeof parsedConfig> =
        loaded.ctor as BridgeConstructorWithFactory<typeof parsedConfig>;

      const bridge =
        typeof typedCtor.create === 'function'
          ? typedCtor.create(parsedConfig)
          : new typedCtor(parsedConfig);
      this.createdBridges.set(id, bridge);
      return bridge;
    } catch (error) {
      console.warn(
        `[llm-bridge-registry] Failed to hydrate bridge ${id} (${rec.manifest.name}):`,
        error
      );
      return null;
    }
  }

  private async ensureDependencyAvailable(manifestName: string): Promise<boolean> {
    if (this.loadedBridges.has(manifestName)) {
      return true;
    }

    try {
      const loaded = await this.llmBridgeLoader.load(manifestName);
      this.loadedBridges.set(loaded.manifest.name, loaded);
      return true;
    } catch (error) {
      console.warn(
        `[llm-bridge-registry] dependency ${manifestName} unavailable during summary scan:`,
        error
      );
      return false;
    }
  }
}
