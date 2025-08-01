import ElectronStore from 'electron-store';
export class McpConfigStore {
  constructor(options) {
    this.store = new ElectronStore({
      name: 'mcp-config',
      ...options,
    });
  }
  get() {
    return this.store.get('config');
  }
  set(config) {
    this.store.set('config', config);
  }
}
