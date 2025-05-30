export class EchoAgent {
  async initialize(): Promise<void> {
    // no-op for the simple echo agent
  }

  async execute(task: string): Promise<string> {
    return `Echo: ${task}`;
  }
}
