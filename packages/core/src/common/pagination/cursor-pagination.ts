export interface CursorPagination {
  cursor: string;
  limit: number;
  direction: 'forward' | 'backward';
}

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string;
  hasMore: boolean;
}
