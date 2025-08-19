import type {
  CursorPagination,
  CursorPaginationResult,
} from '../../../../common/pagination/cursor-pagination';
import type { McpUsageLog, McpUsageQuery, McpUsageStats } from '../types';

export interface McpUsageRepository {
  append(logs: McpUsageLog | McpUsageLog[]): Promise<void>;
  list(query?: McpUsageQuery, pg?: CursorPagination): Promise<CursorPaginationResult<McpUsageLog>>;
  getStats(query?: McpUsageQuery): Promise<McpUsageStats>;
}
