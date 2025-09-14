import { z } from 'zod';
import { defineContract } from './defineContract';

// Minimal, cautious schemas for initial wiring. Align with core types later.
const KnowledgeId = z.string();
const AgentId = z.string();

const DocumentInput = z.object({
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).default([]),
});

const DocumentSummary = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
  updatedAt: z.coerce.date(),
});

const DocumentDetail = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()).default([]),
  content: z.string(),
  updatedAt: z.coerce.date(),
});

const Pagination = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().positive().optional(),
});

export const KnowledgeContract = defineContract({
  namespace: 'knowledge',
  methods: {
    createForAgent: {
      channel: 'knowledge.create-for-agent',
      payload: z.object({ agentId: AgentId }),
      response: z.object({ knowledgeId: KnowledgeId }),
    },
    getByAgent: {
      channel: 'knowledge.get-by-agent',
      payload: z.object({ agentId: AgentId }),
      response: z.object({ knowledgeId: KnowledgeId }).nullable(),
    },
    addDocument: {
      channel: 'knowledge.add-document',
      payload: z.object({ knowledgeId: KnowledgeId, doc: DocumentInput }),
      response: z.object({ docId: z.string() }),
    },
    removeDocument: {
      channel: 'knowledge.remove-document',
      payload: z.object({ knowledgeId: KnowledgeId, docId: z.string() }),
      response: z.object({ success: z.literal(true) }),
    },
    listDocuments: {
      channel: 'knowledge.list-documents',
      payload: z.object({ knowledgeId: KnowledgeId, pagination: Pagination.optional() }),
      response: z.object({
        items: z.array(DocumentSummary),
        nextCursor: z.string().optional(),
        hasMore: z.boolean().default(false),
      }),
    },
    readDocument: {
      channel: 'knowledge.read-document',
      payload: z.object({ knowledgeId: KnowledgeId, docId: z.string() }),
      response: DocumentDetail,
    },
    indexAll: {
      channel: 'knowledge.index-all',
      payload: z.object({ knowledgeId: KnowledgeId }),
      response: z.object({ success: z.boolean() }),
    },
    search: {
      channel: 'knowledge.search',
      payload: z.object({
        knowledgeId: KnowledgeId,
        query: z.string(),
        limit: z.number().int().positive().optional(),
      }),
      response: z.object({ items: z.array(DocumentSummary) }),
    },
    getStats: {
      channel: 'knowledge.get-stats',
      payload: z.object({ knowledgeId: KnowledgeId }),
      response: z.object({
        totalDocuments: z.number().int().nonnegative(),
        totalChunks: z.number().int().nonnegative(),
        lastUpdated: z.coerce.date().nullable(),
        storageSize: z.number().int().nonnegative(),
      }),
    },
  },
});
