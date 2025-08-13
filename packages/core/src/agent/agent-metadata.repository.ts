import type { AgentMetadata, CreateAgentMetadata } from './agent-metadata';
import type {
  CursorPagination,
  CursorPaginationResult,
} from '../common/pagination/cursor-pagination';
import type { AgentSearchQuery } from './agent-search';
import { Unsubscribe } from '../common/event/event-subscriber';

export interface AgentMetadataRepository {
  get(id: string): Promise<AgentMetadata | null>;
  list(pagination?: CursorPagination): Promise<CursorPaginationResult<AgentMetadata>>;
  search(
    query: AgentSearchQuery,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<AgentMetadata>>;
  create(meta: CreateAgentMetadata): Promise<AgentMetadata>;
  update(
    id: string,
    patch: Partial<AgentMetadata>,
    options?: { etag?: string; expectedVersion?: string }
  ): Promise<AgentMetadata>;
  delete(id: string): Promise<void>;

  on?(
    event: 'changed' | 'deleted',
    handler: (p: { id: string; version?: string }) => void
  ): Unsubscribe;
}
