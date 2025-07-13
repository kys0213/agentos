export class PageCache<T> {
  private cache = new Map<number, { data: T; cursor: string | undefined }>();
  constructor(private readonly maxPages: number) {}

  get(page: number): T | undefined {
    const entry = this.cache.get(page);
    if (!entry) {
      return undefined;
    }
    // refresh to mark as recently used
    this.cache.delete(page);
    this.cache.set(page, entry);
    return entry.data;
  }

  set(page: number, data: T, cursor: string | undefined): void {
    if (this.cache.has(page)) {
      this.cache.delete(page);
    } else if (this.cache.size >= this.maxPages) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }
    this.cache.set(page, { data, cursor });
  }

  getCursor(page: number): string | undefined {
    const entry = this.cache.get(page);
    return entry?.cursor;
  }
}
