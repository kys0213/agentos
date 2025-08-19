import { AgentEventBridge } from '../agent-event-bridge';
import { OutboundChannel } from '../../../common/event/outbound-channel';

describe('AgentEventBridge', () => {
  test('publishes session message and streams via agent.* filter', (done) => {
    const oc = new OutboundChannel();
    const bridge = new AgentEventBridge(oc as any);

    const received: any[] = [];
    const sub = bridge.stream().subscribe((ev) => {
      received.push(ev);
      if (received.length === 1) {
        expect(ev.type).toBe('agent.session.message');
        expect((ev as any).payload.sessionId).toBe('s1');
        sub.unsubscribe();
        done();
      }
    });

    bridge.publishSessionMessage('s1', {
      role: 'assistant',
      content: { type: 'text', text: 'hello' },
    } as any);
  });
});

