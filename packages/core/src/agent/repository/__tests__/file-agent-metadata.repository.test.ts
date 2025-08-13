import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { FileAgentMetadataRepository } from '../file-agent-metadata.repository';
import type { CreateAgentMetadata } from '../../agent-metadata';
import type { Preset } from '../../../preset/preset';
import { CoreError } from '../../../common/error/core-error';

function preset(id: string): Preset {
  const now = new Date();
  return {
    id,
    name: `preset-${id}`,
    description: 'desc',
    author: 'tester',
    createdAt: now,
    updatedAt: now,
    version: '1.0.0',
    systemPrompt: '',
    enabledMcps: [],
    llmBridgeName: 'x',
    llmBridgeConfig: {},
    status: 'active',
    usageCount: 0,
    knowledgeDocuments: 0,
    knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    category: [],
  };
}

function createMeta(id: string): CreateAgentMetadata {
  return {
    name: `A-${id}`,
    description: 'agent',
    icon: '🤖',
    keywords: ['k1', 'k2'],
    preset: preset(`p-${id}`),
    status: 'active',
  } as any;
}

describe('FileAgentMetadataRepository', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-meta-'));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('create, get, list, search, update version, delete', async () => {
    const repo = new FileAgentMetadataRepository(dir);
    const a1 = await repo.create(createMeta('1'));
    const a2 = await repo.create(createMeta('2'));

    const got = await repo.get(a1.id);
    expect(got?.id).toBe(a1.id);
    expect(got?.version).toBe('1');

    const list = await repo.list({ limit: 10 });
    expect(list.items.length).toBe(2);

    const searchByName = await repo.search({ name: 'A-1' }, { limit: 10 });
    expect(searchByName.items.some((m) => m.id === a1.id)).toBe(true);
    expect(searchByName.items.some((m) => m.id === a2.id)).toBe(false);

    // optimistic update success
    const upd = await repo.update(
      a1.id,
      { description: 'updated' },
      { expectedVersion: a1.version }
    );
    expect(upd.version && Number(upd.version) > Number(a1.version)).toBe(true);

    // version conflict
    await expect(
      repo.update(a1.id, { description: 'x' }, { expectedVersion: 'mismatch' })
    ).rejects.toBeInstanceOf(CoreError);

    await repo.delete(a2.id);
    const afterDel = await repo.get(a2.id);
    expect(afterDel).toBeNull();
  });
});
