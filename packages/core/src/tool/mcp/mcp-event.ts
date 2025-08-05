import { Progress } from '@modelcontextprotocol/sdk/types.js';

export enum McpEvent {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ON_PROGRESS = 'onProgress',
}

export type McpEventMap = {
  onProgress: { type: 'tool'; name: string; progress: Progress };
  connected: void;
  disconnected: void;
};
