import { paginateByCursor } from '../paginate';

describe('paginateByCursor', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ id: `id-${i + 1}`, v: i + 1 }));

  test('forward default without cursor', () => {
    const { items: page, nextCursor } = paginateByCursor(items, { limit: 3 });
    expect(page.map((x) => x.id)).toEqual(['id-1', 'id-2', 'id-3']);
    expect(nextCursor).toBe('id-3');
  });

  test('forward with cursor', () => {
    const { items: page, nextCursor } = paginateByCursor(items, { limit: 3, cursor: 'id-3' });
    expect(page.map((x) => x.id)).toEqual(['id-4', 'id-5', 'id-6']);
    expect(nextCursor).toBe('id-6');
  });

  test('backward without cursor returns last N and sets nextCursor to first of page', () => {
    const { items: page, nextCursor } = paginateByCursor(items, { limit: 3, direction: 'backward' });
    expect(page.map((x) => x.id)).toEqual(['id-8', 'id-9', 'id-10']);
    expect(nextCursor).toBe('id-8');
  });

  test('backward with cursor returns items before cursor', () => {
    const { items: page, nextCursor } = paginateByCursor(items, {
      limit: 3,
      cursor: 'id-7',
      direction: 'backward',
    });
    expect(page.map((x) => x.id)).toEqual(['id-4', 'id-5', 'id-6']);
    expect(nextCursor).toBe('id-4');
  });
});

