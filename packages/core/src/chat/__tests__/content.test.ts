import { normalizeToCoreContentArray, toCoreContentArray, CoreContent } from '../../index';

describe('Core content standardization', () => {
  test('toCoreContentArray: normalizes single to array', () => {
    const single: CoreContent = { contentType: 'text', value: 'hello' } as CoreContent;
    const arr = toCoreContentArray(single);
    expect(Array.isArray(arr)).toBe(true);
    expect(arr).toHaveLength(1);
    expect(arr[0]).toEqual(single);
  });

  test('toCoreContentArray: keeps array as is', () => {
    const content: CoreContent[] = [
      { contentType: 'text', value: 'a' } as CoreContent,
      { contentType: 'text', value: 'b' } as CoreContent,
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
    const a: any = {};
    a.self = a; // create circular reference
    const arr = normalizeToCoreContentArray(a);
    expect(arr).toHaveLength(1);
    expect(arr[0].contentType).toBe('text');
    // JSON.stringify would fail; fallback is String(obj)
    expect(arr[0].value).toBe('[object Object]');
  });

  test('normalizeToCoreContentArray: passes through image/audio/video/file contents', () => {
    const image = { contentType: 'image', value: 'img-bytes' } as unknown as CoreContent;
    const audio = { contentType: 'audio', value: 'audio-bytes' } as unknown as CoreContent;
    const video = { contentType: 'video', value: 'video-bytes' } as unknown as CoreContent;
    const file = { contentType: 'file', value: 'file-bytes' } as unknown as CoreContent;
    const arr = normalizeToCoreContentArray([image, audio, video, file]);
    expect(arr).toHaveLength(4);
    expect(arr[0]).toEqual(image);
    expect(arr[1]).toEqual(audio);
    expect(arr[2]).toEqual(video);
    expect(arr[3]).toEqual(file);
  });

  test('normalizeToCoreContentArray: array flattens and normalizes', () => {
    const arr = normalizeToCoreContentArray([
      'hi',
      { contentType: 'text', value: 'there' },
      123,
    ]);
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
});


