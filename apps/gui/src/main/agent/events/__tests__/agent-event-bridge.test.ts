import { AgentEventBridge } from '../agent-event-bridge';
import { OutboundChannel } from '../../../common/event/outbound-channel';
import type { Message } from 'llm-bridge-spec';
import type { OutboundEvent } from '../../../common/event/outbound-channel';

describe('AgentEventBridge', () => {
  test('publishes session message and streams via agent.* filter', async () => {
    const oc = new OutboundChannel();
    const bridge = new AgentEventBridge(oc);

    const received: OutboundEvent[] = [];
    const sub = bridge.stream().subscribe((ev) => received.push(ev));

    const msg: Message = {
      role: 'assistant',
      content: [{ contentType: 'text', value: 'hello' }],
    };
    bridge.publishSessionMessage('s1', msg);

    // Allow microtask to flush
    await new Promise((r) => setTimeout(r, 0));
    expect(received.length).toBeGreaterThan(0);
    expect(received[0].type).toBe('agent.session.message');
    const p = received[0].payload as { sessionId?: string };
    expect(p.sessionId).toBe('s1');
    sub.unsubscribe();
  });
});
