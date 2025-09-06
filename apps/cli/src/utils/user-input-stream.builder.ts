import { Matcher, UserInputStreamOptions, InputCallback } from './user-input-stream';
import { UserInputStream } from './user-input-stream';

/**
 * Builder for UserInputStream. Register patterns using {@link on} and then
 * call {@link build} to create the stream runner.
 */

export class UserInputStreamBuilder {
  private matchers: Matcher[] = [];
  private quitPatterns: RegExp[];

  constructor(private readonly options: UserInputStreamOptions = {}) {
    this.quitPatterns = options.quitPatterns?.slice() ?? [/^(quit|exit)$/i];
  }

  /**
   * Register a pattern and its handler.
   * @param pattern Regular expression to match user input
   * @param callback Invoked with the RegExp match result on match
   */
  on(pattern: RegExp, callback: InputCallback): this {
    this.matchers.push({ pattern, callback });
    return this;
  }

  /**
   * Register an additional command that will exit the input loop when entered.
   * @param pattern Command string or RegExp to match
   */
  quit(pattern: string | RegExp): this {
    const regex = typeof pattern === 'string' ? new RegExp(`^${pattern}$`, 'i') : pattern;
    this.quitPatterns.push(regex);
    return this;
  }

  build(): UserInputStream {
    return new UserInputStream(this.matchers, { ...this.options, quitPatterns: this.quitPatterns });
  }
}
