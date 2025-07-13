import { PassThrough } from 'node:stream';
import { createUserInputStream } from '../user-input-stream';

describe('UserInputStream', () => {
  it('resolves when quit is entered', async () => {
    const input = new PassThrough();
    const output = new PassThrough();

    const builder = createUserInputStream({ input, output, prompt: '' });
    const stream = builder.on(/.*/, async () => {}).build();

    const runPromise = stream.run();
    input.write('quit\n');

    await expect(runPromise).resolves.toBeUndefined();
  });

  it('resolves with custom quit command', async () => {
    const input = new PassThrough();
    const output = new PassThrough();

    const builder = createUserInputStream({ input, output, prompt: '' }).quit('q');
    const stream = builder.on(/.*/, async () => {}).build();

    const runPromise = stream.run();
    input.write('q\n');

    await expect(runPromise).resolves.toBeUndefined();
  });

  it('invokes matching handler', async () => {
    const input = new PassThrough();
    const output = new PassThrough();

    let called = false;
    const builder = createUserInputStream({ input, output, prompt: '' });
    const stream = builder
      .on(/^hello$/, async () => {
        called = true;
      })
      .build();

    const runPromise = stream.run();
    input.write('hello\nquit\n');

    await runPromise;
    expect(called).toBe(true);
  });
});
