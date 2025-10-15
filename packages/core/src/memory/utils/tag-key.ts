import { canonicalKey } from './canonical-key';

const TAG_PREFIX = 'tag::';

export function canonicalTagKey(tag: string) {
  return `${TAG_PREFIX}${canonicalKey(tag)}`;
}
