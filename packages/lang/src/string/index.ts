export { camelCase, pascalCase, snakeCase, capitalCase, noCase } from 'change-case-all';
import { noCase } from 'change-case-all';

export function paramCase(input: string): string {
  return noCase(input, { delimiter: '-' });
}

import slugify from 'slugify';
import stringWidth from '@innei/string-width';

export { slugify, stringWidth };

export function escapeStringRegexp(str: string): string {
  return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}
