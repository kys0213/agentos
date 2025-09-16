import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceContainer } from '../../../../shared/di/service-container';
import { KnowledgeBaseManager } from '../KnowledgeBaseManager';

describe('KnowledgeBaseManager readDoc on selection', () => {
  beforeEach(() => ServiceContainer.clear());

  it('fetches full content when selecting a summary-only document', async () => {
    const agentId = 'a1';
    const listDocs = vi.fn().mockResolvedValue({
      items: [{ id: 'd1', title: 'Doc 1', tags: [], updatedAt: new Date().toISOString() }],
      nextCursor: '',
      hasMore: false,
    });
    const readDocument = vi.fn().mockResolvedValue({
      id: 'd1',
      title: 'Doc 1',
      tags: [],
      content: 'Hello from Core',
      updatedAt: new Date().toISOString(),
    });
    const getStats = vi.fn().mockResolvedValue({
      totalDocuments: 1,
      totalChunks: 0,
      lastUpdated: null,
      storageSize: 0,
    });
    const knowledge = {
      listDocs,
      readDoc: readDocument,
      getStats,
    } as unknown as Record<string, unknown>;
    // @ts-expect-error test double registration
    ServiceContainer.register('knowledge', knowledge);

    render(<KnowledgeBaseManager agentId={agentId} agentName="Agent" agentCategory="research" />);

    const docItem = await screen.findByText('Doc 1');
    fireEvent.click(docItem);

    // content fetched
    expect(await screen.findByText('Hello from Core')).toBeInTheDocument();
    expect(readDocument).toHaveBeenCalledTimes(1);
  });
});

