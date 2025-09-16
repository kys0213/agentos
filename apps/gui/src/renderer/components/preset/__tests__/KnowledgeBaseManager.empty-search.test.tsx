import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceContainer } from '../../../../shared/di/service-container';
import { KnowledgeBaseManager } from '../KnowledgeBaseManager';

/* eslint-disable @typescript-eslint/no-explicit-any, no-restricted-syntax */

describe.skip('KnowledgeBaseManager empty search state', () => {
  beforeEach(() => ServiceContainer.clear());

  it('shows helper text when no query', async () => {
    const agentId = 'a1';
    const listDocs = async () => ({ items: [], nextCursor: '', hasMore: false });
    const getStats = async () => ({
      totalDocuments: 0,
      totalChunks: 0,
      lastUpdated: null,
      storageSize: 0,
    });
    const knowledge = { listDocs, getStats };
    // @ts-expect-error test double
    ServiceContainer.register('knowledge', knowledge);

    render(<KnowledgeBaseManager agentId={agentId} agentName="Agent" agentCategory="research" />);

    // Switch to search tab
    const tab = await screen.findByText(/Search & Test/i);
    fireEvent.click(tab);

    expect(await screen.findByText(/Search Results/i)).toBeInTheDocument();
  });
});
