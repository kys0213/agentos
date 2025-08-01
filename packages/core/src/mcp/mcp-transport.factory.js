"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpTransportFactory = void 0;
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/client/streamableHttp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const websocket_js_1 = require("@modelcontextprotocol/sdk/client/websocket.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/client/sse.js");
class McpTransportFactory {
    static create(config) {
        switch (config.type) {
            case 'stdio':
                return new stdio_js_1.StdioClientTransport({
                    command: config.command,
                    args: config.args,
                    env: config.env,
                    cwd: config.cwd,
                });
            case 'streamableHttp':
                return new streamableHttp_js_1.StreamableHTTPClientTransport(new URL(config.url), {
                    requestInit: {
                        headers: config.headers,
                    },
                    reconnectionOptions: config.reconnectionOptions,
                    authProvider: config.authProvider,
                });
            case 'websocket':
                return new websocket_js_1.WebSocketClientTransport(new URL(config.url));
            case 'sse':
                return new sse_js_1.SSEClientTransport(new URL(config.url), {
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
exports.McpTransportFactory = McpTransportFactory;
//# sourceMappingURL=mcp-transport.factory.js.map