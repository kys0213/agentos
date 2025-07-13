import { PaginationResult } from '../pagination';

/**
 * Generic async generator for cursor pagination.
 * `fetch` should accept an optional cursor and return a page of items.
 */
export async function* paginate<T>(
  fetch: (cursor?: string) => Promise<PaginationResult<T>>,
  startCursor?: string
): AsyncGenerator<PaginationResult<T>> {
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
