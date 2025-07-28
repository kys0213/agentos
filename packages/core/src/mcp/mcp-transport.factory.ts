import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { McpConfig } from './mcp-config';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

export class McpTransportFactory {
  static create(config: McpConfig): Transport {
    switch (config.type) {
      case 'stdio':
        return new StdioClientTransport({
          command: config.command,
          args: config.args,
          env: config.env,
          cwd: config.cwd,
        });
      case 'streamableHttp':
        return new StreamableHTTPClientTransport(new URL(config.url), {
          requestInit: {
            headers: config.headers,
          },
          reconnectionOptions: config.reconnectionOptions,
          authProvider: config.authProvider,
        });
      case 'websocket':
        return new WebSocketClientTransport(new URL(config.url));
      case 'sse':
        return new SSEClientTransport(new URL(config.url), {
          requestInit: {
            headers: config.headers,
          },
          eventSourceInit: {
            fetch: (url, init) => {
              const headers = new Headers(Object.assign({}, init?.headers, config.headers));
              return fetch(url, {
                ...init,
                headers,
              });
            },
          },
          authProvider: config.authProvider,
        });
    }
  }
}
