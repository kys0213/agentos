import { KnowledgeClient } from '../gen/knowledge.client';

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
    if (existing && existing.knowledgeId) {
      return existing.knowledgeId;
    }
    const created = await this.client.createForAgent({ agentId });
    return created.knowledgeId;
  }

  async addDoc(agentId: string, doc: { title: string; content: string; tags?: string[] }) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);
    return this.client.addDocument({ knowledgeId, doc });
  }

  async listDocs(agentId: string, pagination?: { cursor?: string; limit?: number }) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);

    const listDocuments = await this.client.listDocuments({ knowledgeId, pagination });

    return listDocuments;
  }

  async readDoc(agentId: string, docId: string) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);
    return this.client.readDocument({ knowledgeId, docId });
  }

  async removeDoc(agentId: string, docId: string) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);
    return this.client.removeDocument({ knowledgeId, docId });
  }

  async indexAll(agentId: string) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);
    return this.client.indexAll({ knowledgeId });
  }

  async search(agentId: string, query: string, limit?: number) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);
    return this.client.search({ knowledgeId, query, limit });
  }

  async getStats(agentId: string) {
    const knowledgeId = await this.ensureKnowledgeForAgent(agentId);
    return this.client.getStats({ knowledgeId });
  }
}
