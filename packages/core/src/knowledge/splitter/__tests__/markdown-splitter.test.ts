import { MarkdownSplitter } from '../../splitter/markdown-splitter';
import { KnowledgeDocumentMeta } from '../../types';

describe('MarkdownSplitter', () => {
  const meta: KnowledgeDocumentMeta = {
    id: 'doc-1' as any,
    presetId: 'preset-1' as any,
    title: 'Doc',
    createdAt: new Date(),
    updatedAt: new Date(),
    mimeType: 'text/markdown',
  };

  it('splits by headings and sliding windows', async () => {
    const md = `# Title\n\nIntro paragraph explaining purpose.\n\n## Section A\nContent A line 1. Content A line 2.\n\n## Section B\nContent B line 1. Content B line 2.`;
    const splitter = new MarkdownSplitter();
    const chunks = await splitter.split(meta, md, { maxChars: 50, overlapChars: 10, maxHeadingDepth: 3 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].breadcrumbs?.length).toBeGreaterThan(0);
    expect(chunks.every((c) => c.text.length <= 50)).toBe(true);
    expect(chunks[0].docId).toBe(meta.id);
  });
});


