// 브라우저 호환을 위한 메모리 기반 LLM Bridge 스토어
export interface LlmBridgeConfig {
  id: string;
  type: 'echo' | 'reverse';
}

export class LlmBridgeStore {
  private bridges: LlmBridgeConfig[] = [
    { id: 'echo', type: 'echo' },
    { id: 'reverse', type: 'reverse' },
  ];

  list(): LlmBridgeConfig[] {
    return [...this.bridges];
  }

  save(config: LlmBridgeConfig): void {
    const index = this.bridges.findIndex((b) => b.id === config.id);
    if (index >= 0) {
      this.bridges[index] = config;
    } else {
      this.bridges.push(config);
    }
  }

  delete(id: string): void {
    this.bridges = this.bridges.filter((b) => b.id !== id);
  }
}
