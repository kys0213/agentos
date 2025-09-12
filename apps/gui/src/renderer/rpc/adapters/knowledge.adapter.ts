import { KnowledgeClient } from '../gen/knowledge.client';
import { KnowledgeContract as C } from '../../../shared/rpc/contracts/knowledge.contract';

export class KnowledgeServiceAdapter {
  constructor(private readonly client: KnowledgeClient) {}

  async ensureKnowledgeForAgent(agentId: string): Promise<string> {
    const existing = await this.client.getByAgent({ agentId });
    if (existing && (existing as any).knowledgeId) {
      return (existing as any).knowledgeId as string;
    }
    const created = await this.client.createForAgent({ agentId });
    return (created as any).knowledgeId as string;
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
}

