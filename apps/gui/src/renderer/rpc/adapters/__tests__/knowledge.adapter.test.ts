import { describe, it, expect } from 'vitest';
import { KnowledgeServiceAdapter } from '../../adapters/knowledge.adapter';

class FakeKnowledgeClient {
  calls: Record<string, unknown[]> = {};
  private rec(name: string, payload: unknown) {
    this.calls[name] = [...(this.calls[name] ?? []), payload];
  }
  async getByAgent(payload: any) {
    this.rec('getByAgent', payload);
    return null;
  }
  async createForAgent(payload: any) {
    this.rec('createForAgent', payload);
    return { knowledgeId: 'kb1' };
  }
  async listDocuments(payload: any) {
    this.rec('listDocuments', payload);
    return { items: [], nextCursor: undefined, hasMore: false };
  }
  async addDocument(payload: any) {
    this.rec('addDocument', payload);
    return { docId: 'd1' };
  }
}

describe('KnowledgeServiceAdapter', () => {
  it('ensures knowledge for agent then lists and adds', async () => {
    const client = new FakeKnowledgeClient() as any;
    const ad = new KnowledgeServiceAdapter(client);
    const agentId = 'agent-1';

    const list = await ad.listDocs(agentId, { limit: 10 });
    expect(list.items).toEqual([]);
    // getByAgent -> createForAgent -> listDocuments
    expect((client as any).calls.getByAgent?.length).toBe(1);
    expect((client as any).calls.createForAgent?.length).toBe(1);
    expect((client as any).calls.listDocuments?.length).toBe(1);

    await ad.addDoc(agentId, { title: 'T', content: 'C' });
    expect((client as any).calls.addDocument?.length).toBe(1);
  });
});
