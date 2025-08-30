import { DocumentSplitter, SplitterOptions } from './document-splitter';
import { KnowledgeChunk, KnowledgeDocumentMeta, BreadcrumbNode } from '../types';
import { slugify } from '@agentos/lang/string';
import { isNonEmptyArray, isNonEmptyString } from '@agentos/lang/validation';

interface Heading {
  level: number; // 1..6
  title: string;
  anchor: string;
  offset: number; // start offset in content
  breadcrumbs: BreadcrumbNode[]; // stack-based unique path (one node per level)
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
    if (!isNonEmptyArray(headings)) {
      this.pushSlidingWindows(meta, content, 0, maxChars, overlap, [], chunks);
      return chunks;
    }

    // For each heading section, determine its text range: from this.heading.offset to next.heading.offset
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      const start = h.offset;
      const end = i + 1 < headings.length ? headings[i + 1].offset : content.length;
      const section = content.slice(start, end).trim();
      const breadcrumbs = h.breadcrumbs;
      this.pushSlidingWindows(meta, section, start, maxChars, overlap, breadcrumbs, chunks);
    }

    // position ordering by source offset
    chunks.sort((a, b) => (a.source?.offsetStart ?? 0) - (b.source?.offsetStart ?? 0));
    chunks.forEach((c, idx) => (c.position = idx));
    return chunks;
  }

  // breadcrumbs are computed in parseHeadings via a stack

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
      if (isNonEmptyString(text)) {
        const chunkId = `${meta.id}:${sectionStartOffset + start}:${chunkSeq++}`;
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
      if (end >= section.length) {
        break;
      }
      start = Math.max(0, end - overlap);
    }
  }

  private parseHeadings(content: string, maxDepth: number): Heading[] {
    const lines = content.split(/\r?\n/);
    const headings: Heading[] = [];
    const stack: BreadcrumbNode[] = [];
    let offset = 0;
    for (const line of lines) {
      const m = /^(#{1,6})\s+(.+)$/.exec(line);
      if (m) {
        const level = Math.min(m[1].length, maxDepth);
        if (level <= maxDepth) {
          const rawTitle = m[2].trim();
          const anchor = slugify(rawTitle);
          // maintain one breadcrumb per level using a stack
          while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            stack.pop();
          }
          const currentNode: BreadcrumbNode = { title: rawTitle, anchor, level };
          stack.push(currentNode);
          const breadcrumbs = [...stack];
          headings.push({ level, title: rawTitle, anchor, offset, breadcrumbs });
        }
      }
      offset += line.length + 1; // + newline
    }
    return headings;
  }
}
