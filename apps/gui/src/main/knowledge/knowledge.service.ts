import { Injectable } from '@nestjs/common';
import { ElectronAppEnvironment } from '../electron/electron-app.environment';
import * as path from 'path';
import * as fs from 'node:fs/promises';
import {
  KnowledgeRepositoryImpl,
  Bm25SearchIndex,
  DefaultIndexSet,
} from '@agentos/core/knowledge';
import type { DocumentMapper, IndexRecord } from '@agentos/core/knowledge/indexing/interfaces';
import type { z } from 'zod';
import type { KnowledgeContract } from '../../shared/rpc/contracts/knowledge.contract';

type KMethods = typeof KnowledgeContract.methods;

@Injectable()
export class KnowledgeService {
  private readonly root: string;
  private readonly repo: KnowledgeRepositoryImpl;
  private readonly agentMapFile: string;
  private agentMapCache: Record<string, string> | null = null;

  constructor(env: ElectronAppEnvironment) {
    this.root = path.join(env.userDataPath, 'knowledge-store');
    // Simple mapper: index title + text content (fileRef not yet supported)
    const mapper: DocumentMapper = {
      async *toRecords(doc): AsyncIterable<IndexRecord> {
        const text = doc.source.kind === 'text' ? doc.source.text : '';
        yield { id: doc.id, fields: { title: doc.title, text } };
      },
    };

    const makeIndexSet = (_kbDir: string) => new DefaultIndexSet([new Bm25SearchIndex()]);

    this.repo = new KnowledgeRepositoryImpl({ rootDir: this.root, mapper, makeIndexSet });

    this.agentMapFile = path.join(this.root, 'agent-knowledge.json');
  }

  // ---------- Agent ↔ Knowledge mapping ----------
  private async loadMap(): Promise<Record<string, string>> {
    if (this.agentMapCache) return this.agentMapCache;
    try {
      const txt = await fs.readFile(this.agentMapFile, 'utf-8');
      this.agentMapCache = JSON.parse(txt) as Record<string, string>;
    } catch {
      this.agentMapCache = {};
    }
    return this.agentMapCache;
  }

  private async saveMap(map: Record<string, string>): Promise<void> {
    await fs.mkdir(path.dirname(this.agentMapFile), { recursive: true });
    await fs.writeFile(this.agentMapFile, JSON.stringify(map, null, 2), 'utf-8');
    this.agentMapCache = map;
  }

  async createForAgent(
    payload: z.infer<KMethods['createForAgent']['payload']>
  ): Promise<z.infer<KMethods['createForAgent']['response']>> {
    const map = await this.loadMap();
    if (map[payload.agentId]) {
      return { knowledgeId: map[payload.agentId] };
    }
    const kb = await this.repo.create({ name: `Agent ${payload.agentId} Knowledge` });
    map[payload.agentId] = kb.id as unknown as string;
    await this.saveMap(map);
    return { knowledgeId: map[payload.agentId] };
  }

  async getByAgent(
    payload: z.infer<KMethods['getByAgent']['payload']>
  ): Promise<z.infer<KMethods['getByAgent']['response']>> {
    const map = await this.loadMap();
    const id = map[payload.agentId];
    return id ? { knowledgeId: id } : null;
  }

  // ---------- Knowledge ops ----------
  async addDocument(
    payload: z.infer<KMethods['addDocument']['payload']>
  ): Promise<z.infer<KMethods['addDocument']['response']>> {
    const kb = await this.repo.get(payload.knowledgeId as any);
    if (!kb) {
      throw new Error('Knowledge not found');
    }
    const doc = await kb.addDoc({
      title: payload.doc.title,
      source: { kind: 'text', text: payload.doc.content } as any,
      tags: payload.doc.tags,
    });
    return { docId: doc.id };
  }

  async removeDocument(
    payload: z.infer<KMethods['removeDocument']['payload']>
  ): Promise<z.infer<KMethods['removeDocument']['response']>> {
    const kb = await this.repo.get(payload.knowledgeId as any);
    if (!kb) throw new Error('Knowledge not found');
    await kb.deleteDoc(payload.docId as any);
    return { success: true } as const;
  }

  async listDocuments(
    payload: z.infer<KMethods['listDocuments']['payload']>
  ): Promise<z.infer<KMethods['listDocuments']['response']>> {
    const kb = await this.repo.get(payload.knowledgeId as any);
    if (!kb) {
      return { items: [], hasMore: false } as any;
    }
    const page = await kb.listDocs(payload.pagination);
    const items = page.items.map((d) => ({
      id: d.id,
      title: d.title,
      tags: d.tags ?? [],
      updatedAt: d.updatedAt ?? d.createdAt,
    }));
    return { items, nextCursor: page.nextCursor, hasMore: !!page.nextCursor } as any;
  }

  async readDocument(
    payload: z.infer<KMethods['readDocument']['payload']>
  ): Promise<z.infer<KMethods['readDocument']['response']>> {
    const kb = await this.repo.get(payload.knowledgeId as any);
    if (!kb) {
      throw new Error('Knowledge not found');
    }
    const page = await kb.listDocs({});
    const doc = page.items.find((d) => d.id === (payload.docId as any));
    if (!doc) {
      throw new Error('Document not found');
    }
    const content = doc.source?.kind === 'text' ? doc.source.text : '';
    return {
      id: doc.id,
      title: doc.title,
      tags: doc.tags ?? [],
      content,
      updatedAt: doc.updatedAt ?? doc.createdAt,
    } as any;
  }

  async indexAll(
    payload: z.infer<KMethods['indexAll']['payload']>
  ): Promise<z.infer<KMethods['indexAll']['response']>> {
    const kb = await this.repo.get(payload.knowledgeId as any);
    if (!kb) throw new Error('Knowledge not found');
    await kb.reindex();
    return { success: true };
  }

  async search(
    payload: z.infer<KMethods['search']['payload']>
  ): Promise<z.infer<KMethods['search']['response']>> {
    const kb = await this.repo.get(payload.knowledgeId as any);
    if (!kb) return { items: [] } as any;
    const hits = await kb.query({ text: payload.query }, { merge: 'max' });
    const docs = await kb.listDocs({});
    const byId = new Map(docs.items.map((d) => [d.id, d]));
    const items = hits.slice(0, payload.limit ?? 10).map((h) => {
      const d = byId.get(h.docId);
      return {
        id: h.docId,
        title: d?.title ?? '(unknown)',
        tags: d?.tags ?? [],
        updatedAt: d?.updatedAt ?? d?.createdAt ?? new Date(),
      };
    });
    return { items } as any;
  }

  async getStats(
    payload: z.infer<KMethods['getStats']['payload']>
  ): Promise<z.infer<KMethods['getStats']['response']>> {
    const kb = await this.repo.get(payload.knowledgeId as any);
    if (!kb) {
      return {
        totalDocuments: 0,
        totalChunks: 0,
        lastUpdated: null,
        storageSize: 0,
      };
    }
    const docs = await kb.listDocs({});
    const stats = await kb.stats();
    const bm25 = stats['bm25'];
    return {
      totalDocuments: docs.items.length,
      totalChunks: bm25?.docCount ?? 0,
      lastUpdated: bm25?.lastBuiltAt ?? null,
      storageSize: 0,
    };
  }
}
