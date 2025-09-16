import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import type { z } from 'zod';
import type { KnowledgeContract } from '../../shared/rpc/contracts/knowledge.contract';
import { KnowledgeService } from './knowledge.service';

type KMethods = typeof KnowledgeContract.methods;

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly svc: KnowledgeService) {}

  @MessagePattern('knowledge.create-for-agent')
  createForAgent(
    payload: z.infer<KMethods['createForAgent']['payload']>
  ): Promise<z.infer<KMethods['createForAgent']['response']>> {
    return this.svc.createForAgent(payload);
  }

  @MessagePattern('knowledge.get-by-agent')
  getByAgent(
    payload: z.infer<KMethods['getByAgent']['payload']>
  ): Promise<z.infer<KMethods['getByAgent']['response']>> {
    return this.svc.getByAgent(payload);
  }

  @MessagePattern('knowledge.add-document')
  addDocument(
    payload: z.infer<KMethods['addDocument']['payload']>
  ): Promise<z.infer<KMethods['addDocument']['response']>> {
    return this.svc.addDocument(payload);
  }

  @MessagePattern('knowledge.remove-document')
  removeDocument(
    payload: z.infer<KMethods['removeDocument']['payload']>
  ): Promise<z.infer<KMethods['removeDocument']['response']>> {
    return this.svc.removeDocument(payload);
  }

  @MessagePattern('knowledge.list-documents')
  listDocuments(
    payload: z.infer<KMethods['listDocuments']['payload']>
  ): Promise<z.infer<KMethods['listDocuments']['response']>> {
    return this.svc.listDocuments(payload);
  }

  @MessagePattern('knowledge.read-document')
  readDocument(
    payload: z.infer<KMethods['readDocument']['payload']>
  ): Promise<z.infer<KMethods['readDocument']['response']>> {
    return this.svc.readDocument(payload);
  }

  @MessagePattern('knowledge.index-all')
  indexAll(
    payload: z.infer<KMethods['indexAll']['payload']>
  ): Promise<z.infer<KMethods['indexAll']['response']>> {
    return this.svc.indexAll(payload);
  }

  @MessagePattern('knowledge.search')
  search(
    payload: z.infer<KMethods['search']['payload']>
  ): Promise<z.infer<KMethods['search']['response']>> {
    return this.svc.search(payload);
  }

  @MessagePattern('knowledge.get-stats')
  getStats(
    payload: z.infer<KMethods['getStats']['payload']>
  ): Promise<z.infer<KMethods['getStats']['response']>> {
    return this.svc.getStats(payload);
  }
}
