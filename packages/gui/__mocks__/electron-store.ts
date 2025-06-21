export default class Store<T> {
  private data: Record<string, any>;
  constructor(options?: { defaults?: Record<string, any> }) {
    this.data = options?.defaults ?? {};
  }
  get(key: string): any {
    return this.data[key];
  }
  set(key: string, value: any): void {
    this.data[key] = value;
  }
}
