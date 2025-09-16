import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { KnowledgeServiceAdapter } from '../../adapters/knowledge.adapter';
import { KnowledgeContract as C } from '../../../../shared/rpc/contracts/knowledge.contract';

type GetByAgentIn = z.input<(typeof C.methods)['getByAgent']['payload']>;
type GetByAgentOut = z.output<(typeof C.methods)['getByAgent']['response']>;
type CreateForAgentIn = z.input<(typeof C.methods)['createForAgent']['payload']>;
type CreateForAgentOut = z.output<(typeof C.methods)['createForAgent']['response']>;
type ListDocsIn = z.input<(typeof C.methods)['listDocuments']['payload']>;
type ListDocsOut = z.output<(typeof C.methods)['listDocuments']['response']>;
type AddDocIn = z.input<(typeof C.methods)['addDocument']['payload']>;
type AddDocOut = z.output<(typeof C.methods)['addDocument']['response']>;
type RemoveDocIn = z.input<(typeof C.methods)['removeDocument']['payload']>;
type RemoveDocOut = z.output<(typeof C.methods)['removeDocument']['response']>;
type ReadDocIn = z.input<(typeof C.methods)['readDocument']['payload']>;
type ReadDocOut = z.output<(typeof C.methods)['readDocument']['response']>;
type IndexAllIn = z.input<(typeof C.methods)['indexAll']['payload']>;
type IndexAllOut = z.output<(typeof C.methods)['indexAll']['response']>;
type GetStatsIn = z.input<(typeof C.methods)['getStats']['payload']>;
type GetStatsOut = z.output<(typeof C.methods)['getStats']['response']>;
type SearchIn = z.input<(typeof C.methods)['search']['payload']>;
type SearchOut = z.output<(typeof C.methods)['search']['response']>;

class FakeKnowledgeClient {
  calls: Record<string, unknown[]> = {};
  private rec(name: string, payload: unknown) {
    this.calls[name] = [...(this.calls[name] ?? []), payload];
  }
  async getByAgent(payload: GetByAgentIn): Promise<GetByAgentOut> {
    this.rec('getByAgent', payload);
    return null;
  }
  async createForAgent(payload: CreateForAgentIn): Promise<CreateForAgentOut> {
    this.rec('createForAgent', payload);
    return { knowledgeId: 'kb1' };
  }
  async listDocuments(payload: ListDocsIn): Promise<ListDocsOut> {
    this.rec('listDocuments', payload);
    return { items: [], nextCursor: undefined, hasMore: false };
  }
  async addDocument(payload: AddDocIn): Promise<AddDocOut> {
    this.rec('addDocument', payload);
    return { docId: 'd1' };
  }
  async removeDocument(_payload: RemoveDocIn): Promise<RemoveDocOut> {
    this.rec('removeDocument', _payload);
    return { success: true } as RemoveDocOut;
  }
  async readDocument(_payload: ReadDocIn): Promise<ReadDocOut> {
    this.rec('readDocument', _payload);
    return { id: 'd1', title: 'T', tags: [], content: '', updatedAt: new Date() } as ReadDocOut;
  }
  async indexAll(_payload: IndexAllIn): Promise<IndexAllOut> {
    this.rec('indexAll', _payload);
    return { success: true } as IndexAllOut;
  }
  async getStats(_payload: GetStatsIn): Promise<GetStatsOut> {
    this.rec('getStats', _payload);
    return { totalDocuments: 0, totalChunks: 0, lastUpdated: null, storageSize: 0 } as GetStatsOut;
  }
  async search(_payload: SearchIn): Promise<SearchOut> {
    this.rec('search', _payload);
    return { items: [] } as SearchOut;
  }
}

describe('KnowledgeServiceAdapter', () => {
  it('ensures knowledge for agent then lists and adds', async () => {
    const client = new FakeKnowledgeClient();
    const ad = new KnowledgeServiceAdapter(client);
    const agentId = 'agent-1';

    const list = await ad.listDocs(agentId, { limit: 10 });
    const parsedList = C.methods['listDocuments'].response.parse(list);
    expect(parsedList.items).toEqual([]);
    // getByAgent -> createForAgent -> listDocuments
    expect(client.calls.getByAgent?.length).toBe(1);
    expect(client.calls.createForAgent?.length).toBe(1);
    expect(client.calls.listDocuments?.length).toBe(1);

    await ad.addDoc(agentId, { title: 'T', content: 'C' });
    expect(client.calls.addDocument?.length).toBe(1);
  });
});
