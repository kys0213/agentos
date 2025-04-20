import { Transport, TransportSendOptions } from '@modelcontextprotocol/sdk/shared/transport';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types';
import { ChildProcess } from 'child_process';

export class McpChildProcessTransport implements Transport {
  public sessionId?: string | undefined;

  constructor(private readonly childProcess: ChildProcess) {}

  async start(): Promise<void> {
    // Implement start logic
    this.childProcess.on('message', (message: JSONRPCMessage) => {
      this.onmessage(message);
    });
  }

  async send(message: JSONRPCMessage, options?: TransportSendOptions): Promise<void> {
    // Implement send logic
    this.childProcess.send(message);
  }

  async close(): Promise<void> {
    // Implement close logic
    if (this.childProcess.killed) {
      return;
    }

    this.childProcess.kill();
  }

  async onclose(): Promise<void> {
    // Implement onclose logic
  }

  async onerror(): Promise<void> {
    // Implement onerror logic
  }

  async onmessage(message: JSONRPCMessage): Promise<void> {
    // Implement onmessage logic
  }
}
