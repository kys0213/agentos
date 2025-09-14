import { KnowledgeClient } from '../gen/knowledge.client';
import { KnowledgeContract as C } from '../../../shared/rpc/contracts/knowledge.contract';

export class KnowledgeServiceAdapter {
  constructor(
    private readonly client: Pick<
      KnowledgeClient,
      | 'getByAgent'
      | 'createForAgent'
      | 'listDocuments'
      | 'addDocument'
      | 'removeDocument'
      | 'indexAll'
      | 'readDocument'
      | 'getStats'
      | 'search'
    >
  ) {}

  async ensureKnowledgeForAgent(agentId: string): Promise<string> {
    const existing = await this.client.getByAgent({ agentId });
    const parsedExisting = C.methods['getByAgent'].response.parse(existing);
    if (parsedExisting && parsedExisting.knowledgeId) {
      return parsedExisting.knowledgeId;
    }
    const created = await this.client.createForAgent({ agentId });
    const parsedCreated = C.methods['createForAgent'].response.parse(created);
    return parsedCreated.knowledgeId;
  }

  async addDoc(agentId: string, doc: { title: string; content: string; tags?: string[] }) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);
    const payload = C.methods['addDocument'].payload.parse({ knowledgeId, doc });
    return this.client.addDocument(payload);
  }

  async listDocs(agentId: string, pagination?: { cursor?: string; limit?: number }) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);
    const payload = C.methods['listDocuments'].payload.parse({ knowledgeId, pagination });
    return this.client.listDocuments(payload);
  }

  async readDoc(agentId: string, docId: string) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);
    const payload = C.methods['readDocument'].payload.parse({ knowledgeId, docId });
    return this.client.readDocument(payload);
  }

  async removeDoc(agentId: string, docId: string) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);
    const payload = C.methods['removeDocument'].payload.parse({ knowledgeId, docId });
    return this.client.removeDocument(payload);
  }

  async indexAll(agentId: string) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);
    const payload = C.methods['indexAll'].payload.parse({ knowledgeId });
    return this.client.indexAll(payload);
  }

  async search(agentId: string, query: string, limit?: number) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);
    const payload = C.methods['search'].payload.parse({ knowledgeId, query, limit });
    return this.client.search(payload);
  }

  async getStats(agentId: string) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);
    const payload = C.methods['getStats'].payload.parse({ knowledgeId });
    return this.client.getStats(payload);
  }
}
