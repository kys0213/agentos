import readline from 'node:readline/promises';
import type { Readable, Writable } from 'node:stream';

export interface UserInputStreamOptions {
  /** Prompt shown to the user for each input. Defaults to '> '. */
  prompt?: string;
  /** Input stream. Defaults to process.stdin. */
  input?: Readable;
  /** Output stream. Defaults to process.stdout. */
  output?: Writable;
}

export type InputCallback = (match: RegExpMatchArray) => void | Promise<void>;

interface Matcher {
  pattern: RegExp;
  callback: InputCallback;
}

/**
 * Builder for UserInputStream. Register patterns using {@link on} and then
 * call {@link build} to create the stream runner.
 */
export class UserInputStreamBuilder {
  private matchers: Matcher[] = [];
  constructor(private readonly options: UserInputStreamOptions = {}) {}

  /**
   * Register a pattern and its handler.
   * @param pattern Regular expression to match user input
   * @param callback Invoked with the RegExp match result on match
   */
  on(pattern: RegExp, callback: InputCallback): this {
    this.matchers.push({ pattern, callback });
    return this;
  }

  build(): UserInputStream {
    return new UserInputStream(this.matchers, this.options);
  }
}

/**
 * User input stream processor. Use {@link UserInputStreamBuilder} to create an
 * instance. Call {@link run} to start handling input. The promise resolves when
 * the user types `quit` or `exit`, and rejects if a handler throws.
 */
export class UserInputStream {
  private readonly prompt: string;
  private readonly input: Readable;
  private readonly output: Writable;
  private readonly matchers: Matcher[];

  constructor(matchers: Matcher[], options: UserInputStreamOptions = {}) {
    this.matchers = matchers;
    this.prompt = options.prompt ?? '> ';
    this.input = options.input ?? process.stdin;
    this.output = options.output ?? process.stdout;
  }

  async run(): Promise<void> {
    const rl = readline.createInterface({ input: this.input, output: this.output });

    try {
      for (;;) {
        const line = await rl.question(this.prompt);
        const trimmed = line.trim();
        if (/^(quit|exit)$/i.test(trimmed)) {
          rl.close();
          break;
        }

        let handled = false;
        for (const { pattern, callback } of this.matchers) {
          const match = trimmed.match(pattern);
          if (match) {
            await callback(match);
            handled = true;
            break;
          }
        }

        if (!handled) {
          // Unknown command: simply ignore for now
        }
      }
    } catch (err) {
      rl.close();
      throw err;
    }
  }
}

export function createUserInputStream(options?: UserInputStreamOptions): UserInputStreamBuilder {
  return new UserInputStreamBuilder(options);
}
