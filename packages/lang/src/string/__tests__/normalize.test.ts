import { describe, expect, it } from 'vitest';
import { normalizeText, tokenizeNormalized } from '../normalize';

describe('normalizeText', () => {
  it('lowercases and strips punctuation by default', () => {
    expect(normalizeText('Hello, WORLD! @AgentOS #1')).toBe('hello world @agentos 1');
  });

  it('respects option overrides', () => {
    expect(
      normalizeText('Foo Bar', {
        toLowercase: false,
        collapseWhitespace: false,
      })
    ).toBe('Foo Bar');
  });

  it('allows keeping punctuation when stripRegex is null', () => {
    expect(
      normalizeText('Keep: punctuation?', {
        stripRegex: null,
      })
    ).toBe('keep: punctuation?');
  });
});

describe('tokenizeNormalized', () => {
  it('splits normalized text into tokens', () => {
    expect(tokenizeNormalized('Hello, new   World!')).toEqual(['hello', 'new', 'world']);
  });

  it('returns empty array for empty input', () => {
    expect(tokenizeNormalized('   ')).toEqual([]);
  });
});
