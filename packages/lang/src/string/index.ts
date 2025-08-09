export { camelCase, pascalCase, snakeCase, capitalCase, noCase } from 'change-case';
import { noCase } from 'change-case';

export function paramCase(input: string): string {
  return noCase(input, { delimiter: '-' });
}

import slugify from 'slugify';
import escapeStringRegexp from 'escape-string-regexp';
import stringWidth from 'string-width';

export { slugify, escapeStringRegexp, stringWidth };
