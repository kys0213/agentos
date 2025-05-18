import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse';
import { McpConfig } from './mcp-config';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport';

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
