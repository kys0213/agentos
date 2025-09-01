import { AgentEventBridge, type AgentEventPayload } from '../agent-event-bridge';
import { OutboundChannel } from '../../../common/event/outbound-channel';
import type { Message } from 'llm-bridge-spec';
import type { OutboundEvent } from '../../../common/event/outbound-channel';

describe('AgentEventBridge', () => {
  test('publishes session message and streams via agent.* filter', (done) => {
    const oc = new OutboundChannel();
    const bridge = new AgentEventBridge(oc);

    const received: OutboundEvent<AgentEventPayload>[] = [];
    const sub = bridge.stream().subscribe((ev) => {
      received.push(ev);
      if (received.length === 1) {
        expect(ev.type).toBe('agent.session.message');
        if ('message' in ev.payload) {
          expect(ev.payload.sessionId).toBe('s1');
        }
        sub.unsubscribe();
        done();
      }
    });

    const msg: Message = {
      role: 'assistant',
      content: [{ contentType: 'text', value: 'hello' }],
    };
    bridge.publishSessionMessage('s1', msg);
  });
});
