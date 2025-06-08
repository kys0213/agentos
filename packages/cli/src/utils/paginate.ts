import { CursorPaginationResult } from '@agentos/core';

/**
 * Generic async generator for cursor pagination.
 * `fetch` should accept an optional cursor and return a page of items.
 */
export async function* paginate<T>(
  fetch: (cursor?: string) => Promise<CursorPaginationResult<T>>,
  startCursor?: string
): AsyncGenerator<CursorPaginationResult<T>> {
  let cursor = startCursor;
  while (true) {
    const page = await fetch(cursor);
    yield page;
    if (!page.nextCursor) {
      break;
    }
    cursor = page.nextCursor;
  }
}
