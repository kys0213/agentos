import { FunctionPublisher, CompositePublisher } from '../../event/function-publisher';

describe('FunctionPublisher', () => {
  test('publishes with prefix', () => {
    const calls: Array<{ ch: string; p: unknown }> = [];
    const pub = new FunctionPublisher(
      (ch, p) => {
        calls.push({ ch, p });
      },
      {
        channelPrefix: 'agentos:',
      }
    );
    pub.publish('agent/status', { x: 1 });
    expect(calls[0].ch).toBe('agentos:agent/status');
    expect(calls[0].p).toEqual({ x: 1 });
  });

  test('serializes json when enabled', () => {
    const calls: Array<{ ch: string; p: unknown }> = [];
    const pub = new FunctionPublisher(
      (ch, p) => {
        calls.push({ ch, p });
      },
      { serializeJson: true }
    );
    pub.publish('ch', { a: 1 });
    expect(typeof calls[0].p).toBe('string');
    expect(JSON.parse(calls[0].p as string)).toEqual({ a: 1 });
  });
});

describe('CompositePublisher', () => {
  test('fan-out to multiple publishers', () => {
    const a: Array<{ ch: string; p: unknown }> = [];
    const b: Array<{ ch: string; p: unknown }> = [];
    const pa = new FunctionPublisher((ch, p) => {
      a.push({ ch, p });
    });
    const pb = new FunctionPublisher((ch, p) => {
      b.push({ ch, p });
    });
    const comp = new CompositePublisher([pa, pb]);
    comp.publish('x', 123);
    expect(a.length).toBe(1);
    expect(b.length).toBe(1);
  });
});
