import { SimpleEventEmitter } from '../simple-event-emitter';

describe('SimpleEventEmitter', () => {
  it('should register and emit events', () => {
    type Events = { foo: number; bar: string };
    const emitter = new SimpleEventEmitter<Events>();
    const received: number[] = [];
    const unsub = emitter.on('foo', (p) => received.push(p));
    emitter.emit('foo', 1);
    expect(received).toEqual([1]);
    unsub();
    emitter.emit('foo', 2);
    expect(received).toEqual([1]);
  });
});
