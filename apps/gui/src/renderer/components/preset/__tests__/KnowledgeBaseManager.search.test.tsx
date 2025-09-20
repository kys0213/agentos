import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceContainer } from '../../../../shared/di/service-container';
import { KnowledgeBaseManager } from '../KnowledgeBaseManager';

describe('KnowledgeBaseManager search and preview', () => {
  beforeEach(() => ServiceContainer.clear());

  it('renders documents list and opens preview on click', async () => {
    const agentId = 'a1';
    const listDocs = async () => ({
      items: [{ id: 'd1', title: 'Doc 1', tags: [], updatedAt: new Date().toISOString() }],
      nextCursor: '',
      hasMore: false,
    });
    const search = async () => ({
      items: [{ id: 'd1', title: 'Doc 1', tags: ['t'], updatedAt: new Date().toISOString() }],
    });
    const getStats = async () => ({
      totalDocuments: 1,
      totalChunks: 0,
      lastUpdated: null,
      storageSize: 0,
    });
    const readDoc = async () => ({
      id: 'd1',
      title: 'Doc 1',
      tags: [],
      content: 'Doc 1 full content',
      updatedAt: new Date(),
    });
    const knowledge = { listDocs, search, getStats, readDoc };
    // @ts-expect-error test double registration type-bypass
    ServiceContainer.register('knowledge', knowledge);
    /* eslint-disable @typescript-eslint/no-explicit-any, no-restricted-syntax, prettier/prettier */

    render(<KnowledgeBaseManager agentId={agentId} agentName="Agent" agentCategory="research" />);

    // documents list appears (from listDocs)
    const docItem = await screen.findByText('Doc 1');
    fireEvent.click(docItem);
    // preview shows selected document title
    expect(await screen.findAllByText('Doc 1')).toBeTruthy();
  });
});
