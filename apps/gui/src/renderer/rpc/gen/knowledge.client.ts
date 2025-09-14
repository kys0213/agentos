// AUTO-GENERATED STYLE CLIENT (handwritten for now). DO NOT EDIT CONTRACTS.
import type { RpcClient } from '../../../shared/rpc/transport';
import { KnowledgeContract as C } from '../../../shared/rpc/contracts/knowledge.contract';
import { z } from 'zod';

export class KnowledgeClient {
  constructor(private readonly transport: RpcClient) {}

  createForAgent(payload: z.input<(typeof C.methods)['createForAgent']['payload']>) {
    return this.transport.request(C.methods['createForAgent'].channel, payload);
  }
  getByAgent(payload: z.input<(typeof C.methods)['getByAgent']['payload']>) {
    return this.transport.request(C.methods['getByAgent'].channel, payload);
  }
  addDocument(payload: z.input<(typeof C.methods)['addDocument']['payload']>) {
    return this.transport.request(C.methods['addDocument'].channel, payload);
  }
  removeDocument(payload: z.input<(typeof C.methods)['removeDocument']['payload']>) {
    return this.transport.request(C.methods['removeDocument'].channel, payload);
  }
  listDocuments(payload: z.input<(typeof C.methods)['listDocuments']['payload']>) {
    return this.transport.request(C.methods['listDocuments'].channel, payload);
  }
  readDocument(payload: z.input<(typeof C.methods)['readDocument']['payload']>) {
    return this.transport.request(C.methods['readDocument'].channel, payload);
  }
  indexAll(payload: z.input<(typeof C.methods)['indexAll']['payload']>) {
    return this.transport.request(C.methods['indexAll'].channel, payload);
  }
  search(payload: z.input<(typeof C.methods)['search']['payload']>) {
    return this.transport.request(C.methods['search'].channel, payload);
  }
  getStats(payload: z.input<(typeof C.methods)['getStats']['payload']>) {
    return this.transport.request(C.methods['getStats'].channel, payload);
  }
}
