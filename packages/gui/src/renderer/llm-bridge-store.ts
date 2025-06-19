import Store from 'electron-store';

export interface LlmBridgeConfig {
  id: string;
  type: 'echo' | 'reverse';
}

export class LlmBridgeStore {
  private store: Store<{ bridges: LlmBridgeConfig[] }>;

  constructor(options?: Store.Options<{ bridges: LlmBridgeConfig[] }>) {
    this.store = new Store<{ bridges: LlmBridgeConfig[] }>({
      name: 'llm-bridges',
      defaults: { bridges: [] },
      ...options,
    });
  }

  list(): LlmBridgeConfig[] {
    return this.store.get('bridges');
  }

  save(config: LlmBridgeConfig): void {
    const bridges = this.list().filter((b) => b.id !== config.id);
    bridges.push(config);
    this.store.set('bridges', bridges);
  }

  delete(id: string): void {
    const bridges = this.list().filter((b) => b.id !== id);
    this.store.set('bridges', bridges);
  }
}
