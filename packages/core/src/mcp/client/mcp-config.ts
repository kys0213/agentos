export interface StdioMcpConfig {
  name: string;
  version: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  network?: {
    timeout?: number;
    maxTotalTimeout?: number;
  };
}
