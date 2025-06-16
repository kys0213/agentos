import Store from 'electron-store';
import { McpConfig } from '@agentos/core';

export class McpConfigStore {
  private store: Store<{ config: McpConfig | undefined }>;

  constructor(options?: Store.Options<{ config: McpConfig | undefined }>) {
    this.store = new Store<{ config: McpConfig | undefined }>({
      name: 'mcp-config',
      ...options,
    });
  }

  get(): McpConfig | undefined {
    return this.store.get('config');
  }

  set(config: McpConfig): void {
    this.store.set('config', config);
  }
}
