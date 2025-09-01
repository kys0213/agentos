import { FunctionSubscriber } from '../../event/event-subscriber';
import { subscribeJson } from '../../event/ipc-renderer-helpers';
import { isAgentStatusPayload, isSessionMessagePayload } from '../../event/ipc-payload-guards';

describe('FunctionSubscriber + subscribeJson', () => {
  test('invokes handler for valid guarded payloads', () => {
    const listeners: Record<string, ((p: unknown) => void)[]> = {};
    const sub = new FunctionSubscriber((ch, h) => {
      (listeners[ch] ??= []).push(h);
      return () => {
        listeners[ch] = (listeners[ch] || []).filter((x) => x !== h);
      };
    });

    const seen: import('../../event/ipc-payload-guards').AgentStatusPayload[] = [];
    subscribeJson(sub, 'agent/status', isAgentStatusPayload, (p) => seen.push(p));

    // simulate JSON string payload
    listeners['agent/status'][0](JSON.stringify({ agentId: 'a', status: 'active' }));
    expect(seen.length).toBe(1);
    expect(seen[0].agentId).toBe('a');

    // invalid payload should be ignored
    listeners['agent/status'][0]({ foo: 'bar' });
    expect(seen.length).toBe(1);
  });

  test('session message guard works', () => {
    const listeners: Record<string, ((p: unknown) => void)[]> = {};
    const sub = new FunctionSubscriber((ch, h) => {
      (listeners[ch] ??= []).push(h);
      return () => {};
    });

    const seen: import('../../event/ipc-payload-guards').SessionMessagePayload[] = [];
    subscribeJson(sub, 'agent/session/s-1/message', isSessionMessagePayload, (p) => seen.push(p));
    listeners['agent/session/s-1/message'][0]({
      agentId: 'a',
      sessionId: 's-1',
      message: { messageId: 'm1' },
    });
    expect(seen.length).toBe(1);
    expect(seen[0].message.messageId).toBe('m1');
  });
});
