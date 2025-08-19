import { AgentEventBridge } from '../agent-event-bridge';
import { OutboundChannel } from '../../../common/event/outbound-channel';
import type { Message } from 'llm-bridge-spec';

describe('AgentEventBridge', () => {
  test('publishes session message and streams via agent.* filter', (done) => {
    const oc = new OutboundChannel();
    const bridge = new AgentEventBridge(oc);

    const received: any[] = [];
    const sub = bridge.stream().subscribe((ev) => {
      received.push(ev);
      if (received.length === 1) {
        expect(ev.type).toBe('agent.session.message');
        expect((ev.payload as any).sessionId).toBe('s1');
        sub.unsubscribe();
        done();
      }
    });

    const msg: Message = { role: 'assistant', content: { type: 'text', text: 'hello' } };
    bridge.publishSessionMessage('s1', msg);
  });
});
