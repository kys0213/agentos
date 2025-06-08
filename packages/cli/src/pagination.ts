import { CursorPaginationResult } from '@agentos/core';

export async function* paginate<T>(
  fetch: (cursor?: string) => Promise<CursorPaginationResult<T>>
): AsyncGenerator<T[]> {
  let cursor: string | undefined;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { items, nextCursor } = await fetch(cursor);
    if (items.length) {
      yield items;
    }
    if (!nextCursor) {
      break;
    }
    cursor = nextCursor;
  }
}
