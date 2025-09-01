import { normalizeToCoreContentArray, toCoreContentArray, CoreContent } from '../../index';
import { Readable } from 'stream';

describe('Core content standardization', () => {
  test('toCoreContentArray: normalizes single to array', () => {
    const single: CoreContent = { contentType: 'text', value: 'hello' };
    const arr = toCoreContentArray(single);
    expect(Array.isArray(arr)).toBe(true);
    expect(arr).toHaveLength(1);
    expect(arr[0]).toEqual(single);
  });

  test('toCoreContentArray: keeps array as is', () => {
    const content: CoreContent[] = [
      { contentType: 'text', value: 'a' },
      { contentType: 'text', value: 'b' },
    ];
    const arr = toCoreContentArray(content);
    expect(arr).toBe(content);
  });

  test('normalizeToCoreContentArray: string → text content', () => {
    const arr = normalizeToCoreContentArray('hello world');
    expect(arr).toHaveLength(1);
    expect(arr[0].contentType).toBe('text');
    expect(arr[0].value).toBe('hello world');
  });

  test('normalizeToCoreContentArray: null/undefined → empty array', () => {
    expect(normalizeToCoreContentArray(null)).toEqual([]);
    expect(normalizeToCoreContentArray(undefined)).toEqual([]);
  });

  test('normalizeToCoreContentArray: legacy-like object kept as CoreContent', () => {
    const arr = normalizeToCoreContentArray({ contentType: 'text', value: 'x' });
    expect(arr).toHaveLength(1);
    expect(arr[0]).toEqual({ contentType: 'text', value: 'x' });
  });

  test('normalizeToCoreContentArray: circular object → String fallback', () => {
    interface Circular { self?: unknown; [k: string]: unknown }
    const a: Circular = {};
    a.self = a; // create circular reference
    const arr = normalizeToCoreContentArray(a);
    expect(arr).toHaveLength(1);
    expect(arr[0].contentType).toBe('text');
    // JSON.stringify would fail; fallback is String(obj)
    expect(arr[0].value).toBe('[object Object]');
  });

  test('normalizeToCoreContentArray: passes through image/audio/video/file contents', () => {
    const image: CoreContent = { contentType: 'image', value: Buffer.from('img') };
    const audio: CoreContent = { contentType: 'audio', value: Buffer.from('aud') };
    const video: CoreContent = { contentType: 'video', value: Buffer.from('vid') };
    const file: CoreContent = { contentType: 'file', value: Buffer.from('fil') };
    const arr = normalizeToCoreContentArray([image, audio, video, file]);
    expect(arr).toHaveLength(4);
    expect(arr[0]).toEqual(image);
    expect(arr[1]).toEqual(audio);
    expect(arr[2]).toEqual(video);
    expect(arr[3]).toEqual(file);
  });

  test('normalizeToCoreContentArray: array flattens and normalizes', () => {
    const arr = normalizeToCoreContentArray(['hi', { contentType: 'text', value: 'there' }, 123]);
    expect(arr).toHaveLength(3);
    expect(arr[0]).toEqual({ contentType: 'text', value: 'hi' });
    expect(arr[1]).toEqual({ contentType: 'text', value: 'there' });
    expect(arr[2]).toEqual({ contentType: 'text', value: '123' });
  });

  test('normalizeToCoreContentArray: object non-standard → JSON string', () => {
    const arr = normalizeToCoreContentArray({ foo: 'bar' });
    expect(arr).toHaveLength(1);
    expect(arr[0].contentType).toBe('text');
    expect(typeof arr[0].value).toBe('string');
    expect(arr[0].value).toBe(JSON.stringify({ foo: 'bar' }));
  });

  test('normalizeToCoreContentArray: Buffer → file content', () => {
    const buf = Buffer.from('abc');
    const arr = normalizeToCoreContentArray(buf);
    expect(arr).toHaveLength(1);
    expect(arr[0].contentType).toBe('file');
    expect(Buffer.isBuffer(arr[0].value)).toBe(true);
  });

  test('normalizeToCoreContentArray: Readable → file content', () => {
    const readable = Readable.from(['chunk1']);
    const arr = normalizeToCoreContentArray(readable);
    expect(arr).toHaveLength(1);
    expect(arr[0].contentType).toBe('file');
  });
});
