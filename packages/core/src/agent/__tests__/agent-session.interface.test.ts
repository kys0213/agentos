import type { AgentSession } from '../../index';

describe('AgentSession interface', () => {
  it('should define required methods and events', () => {
    // 타입 레벨 확인용 더미 구현
    const impl: AgentSession = {
      id: 's-1',
      async chat() {
        return [];
      },
      async getHistory() {
        return { items: [], nextCursor: '' };
      },
      async terminate() {},
      on() {
        return () => {};
      },
      async providePromptResponse() {},
      async provideConsentDecision() {},
      async provideSensitiveInput() {},
    };

    expect(typeof impl.id).toBe('string');
    expect(typeof impl.chat).toBe('function');
    expect(typeof impl.getHistory).toBe('function');
    expect(typeof impl.terminate).toBe('function');
    expect(typeof impl.on).toBe('function');
  });
});
