export interface PaginationResult<T> {
  items: T[];
  nextCursor?: string;
}

export interface Page<T> {
  items: T[];
  startCursor?: string;
  nextCursor?: string;
}

export async function* paginate<T>(
  fetch: (cursor?: string) => Promise<PaginationResult<T>>,
  startCursor?: string
): AsyncGenerator<Page<T>> {
  let cursor = startCursor;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { items, nextCursor } = await fetch(cursor);
    yield { items, startCursor: cursor, nextCursor };
    if (!nextCursor) {
      break;
    }
    cursor = nextCursor;
  }
}
