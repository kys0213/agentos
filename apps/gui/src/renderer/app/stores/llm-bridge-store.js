import ElectronStore from 'electron-store';
export class LlmBridgeStore {
  constructor(options) {
    this.store = new ElectronStore({
      name: 'llm-bridges',
      defaults: { bridges: [] },
      ...options,
    });
  }
  list() {
    return this.store.get('bridges');
  }
  save(config) {
    const bridges = this.list().filter((b) => b.id !== config.id);
    bridges.push(config);
    this.store.set('bridges', bridges);
  }
  delete(id) {
    const bridges = this.list().filter((b) => b.id !== id);
    this.store.set('bridges', bridges);
  }
}
