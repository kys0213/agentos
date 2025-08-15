import type { CursorPagination, CursorPaginationResult } from './cursor-pagination';

type PartialPagination = Partial<CursorPagination>;

export function paginateByCursor<T extends { id: string }>(
  items: T[],
  pagination: PartialPagination = {}
): CursorPaginationResult<T> {
  const { cursor, limit = 20, direction = 'forward' } = pagination;

  if (direction === 'backward') {
    let list = items;

    if (cursor) {
      const idx = items.findIndex((i) => i.id === cursor);
      if (idx >= 0) list = items.slice(0, idx);
    }

    const start = Math.max(0, list.length - limit);
    const page = list.slice(start);
    const nextCursor = page.length === limit ? page[0].id : '';
    return { items: page, nextCursor, hasMore: !!nextCursor };
  } else {
    let list = items;

    if (cursor) {
      const idx = items.findIndex((i) => i.id === cursor);
      if (idx >= 0) list = items.slice(idx + 1);
    }

    const page = list.slice(0, limit);
    const nextCursor = page.length === limit ? page[page.length - 1].id : '';

    return { items: page, nextCursor, hasMore: !!nextCursor };
  }
}
