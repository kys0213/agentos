import path from 'path';
import fs from 'fs';
import { MarkdownSplitter } from '../../splitter/markdown-splitter';
import { KnowledgeDocumentMeta, KnowledgeDocId, PresetId } from '../../types';

import { vi } from 'vitest';

describe('MarkdownSplitter', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  const meta: KnowledgeDocumentMeta = {
    id: 'doc-1' as KnowledgeDocId,
    presetId: 'preset-1' as PresetId,
    title: 'Doc',
    createdAt: new Date(),
    updatedAt: new Date(),
    mimeType: 'text/markdown',
  };

  it('splits by headings and sliding windows', async () => {
    const md = `# Title\n\nIntro paragraph explaining purpose.\n\n## Section A\nContent A line 1. Content A line 2.\n\n## Section B\nContent B line 1. Content B line 2.`;
    const splitter = new MarkdownSplitter();
    const chunks = await splitter.split(meta, md, {
      maxChars: 50,
      overlapChars: 10,
      maxHeadingDepth: 3,
    });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].breadcrumbs?.length).toBeGreaterThan(0);
    expect(chunks.every((c) => c.text.length <= 50)).toBe(true);
    expect(chunks[0].docId).toBe(meta.id);
  });

  it('splits by headings and sliding windows (dummy.md)', async () => {
    const md = fs.readFileSync(path.join(__dirname, 'data', 'dummy.md'), 'utf8');
    const splitter = new MarkdownSplitter();

    const chunks = await splitter.split(meta, md, {
      maxChars: 1000,
      overlapChars: 100,
      maxHeadingDepth: 6,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].breadcrumbs?.length).toBeGreaterThan(0);
    expect(chunks.every((c) => c.text.length <= 1000)).toBe(true);
    expect(chunks[0].docId).toBe(meta.id);
    expect(chunks).toMatchSnapshot();
  });
});
