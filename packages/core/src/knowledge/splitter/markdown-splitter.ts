import { DocumentSplitter, SplitterOptions } from './document-splitter';
import { KnowledgeChunk, KnowledgeDocumentMeta, BreadcrumbNode } from '../types';

interface Heading {
  level: number; // 1..6
  title: string;
  anchor: string;
  offset: number; // start offset in content
}

export class MarkdownSplitter implements DocumentSplitter {
  async split(
    meta: KnowledgeDocumentMeta,
    content: string,
    options?: SplitterOptions
  ): Promise<KnowledgeChunk[]> {
    const maxChars = options?.maxChars ?? 1500;
    const overlap = options?.overlapChars ?? 200;
    const maxDepth = options?.maxHeadingDepth ?? 3;

    const headings = this.parseHeadings(content, maxDepth);
    const chunks: KnowledgeChunk[] = [];

    // If no headings, fallback to sliding window over entire doc
    if (headings.length === 0) {
      this.pushSlidingWindows(meta, content, 0, maxChars, overlap, [], chunks);
      return chunks;
    }

    // For each heading section, determine its text range: from this.heading.offset to next.heading.offset
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      const start = h.offset;
      const end = i + 1 < headings.length ? headings[i + 1].offset : content.length;
      const section = content.slice(start, end).trim();
      const breadcrumbs = this.buildBreadcrumbs(headings, i);
      this.pushSlidingWindows(meta, section, start, maxChars, overlap, breadcrumbs, chunks);
    }

    // position ordering by source offset
    chunks.sort((a, b) => (a.source?.offsetStart ?? 0) - (b.source?.offsetStart ?? 0));
    chunks.forEach((c, idx) => (c.position = idx));
    return chunks;
  }

  private buildBreadcrumbs(headings: Heading[], index: number): BreadcrumbNode[] {
    const result: BreadcrumbNode[] = [];
    const currentLevel = headings[index].level;
    for (let i = index; i >= 0; i--) {
      const h = headings[i];
      if (h.level <= currentLevel) {
        result.unshift({ title: h.title, anchor: h.anchor, level: h.level });
      }
      if (h.level === 1) break;
    }
    return result;
  }

  private pushSlidingWindows(
    meta: KnowledgeDocumentMeta,
    section: string,
    sectionStartOffset: number,
    maxChars: number,
    overlap: number,
    breadcrumbs: BreadcrumbNode[],
    out: KnowledgeChunk[]
  ) {
    let start = 0;
    let chunkSeq = 0;
    while (start < section.length) {
      const end = Math.min(section.length, start + maxChars);
      const text = section.slice(start, end).trim();
      if (text.length > 0) {
        const chunkId = `${meta.id}:${sectionStartOffset + start}:${chunkSeq++}` as any;
        out.push({
          docId: meta.id,
          chunkId,
          text,
          position: 0, // will be re-assigned later
          breadcrumbs,
          anchors: breadcrumbs.map((b) => b.anchor!).filter(Boolean),
          source: { offsetStart: sectionStartOffset + start, offsetEnd: sectionStartOffset + end },
        });
      }
      if (end >= section.length) break;
      start = Math.max(0, end - overlap);
    }
  }

  private parseHeadings(content: string, maxDepth: number): Heading[] {
    const lines = content.split(/\r?\n/);
    const headings: Heading[] = [];
    let offset = 0;
    for (const line of lines) {
      const m = /^(#{1,6})\s+(.+)$/.exec(line);
      if (m) {
        const level = Math.min(m[1].length, maxDepth);
        if (level <= maxDepth) {
          const rawTitle = m[2].trim();
          const anchor = this.slugify(rawTitle);
          headings.push({ level, title: rawTitle, anchor, offset });
        }
      }
      offset += line.length + 1; // + newline
    }
    return headings;
  }

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}


