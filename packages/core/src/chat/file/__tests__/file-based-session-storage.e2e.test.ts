import fs from 'fs/promises';
import path from 'path';
import { Checkpoint, MessageHistory } from '../../chat-session';
import { FileBasedSessionStorage } from '../file-based-session-storage';
import { FileBasedSessionMetadata } from '../file-based-session.metadata';

describe('FileBasedSessionStorage E2E', () => {
  let storage: FileBasedSessionStorage;
  let testDir: string;
  let sessionId: string;

  beforeEach(async () => {
    // 임시 디렉토리 생성
    testDir = path.join(__dirname, 'sessions');

    await fs.mkdir(testDir, { recursive: true });

    storage = new FileBasedSessionStorage(testDir);
    sessionId = 'test-session';
  });

  afterEach(async () => {
    // 테스트 디렉토리 정리
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('세션 메타데이터 저장 및 로드', () => {
    it('세션 메타데이터를 저장하고 로드할 수 있어야 한다', async () => {
      const metadata = await initMetadata(sessionId);
      const loadedMetadata = await storage.getSessionMetadata(sessionId);

      expect(loadedMetadata).toEqual(metadata);
    });
  });

  describe('메시지 히스토리 저장 및 로드', () => {
    it('메시지 히스토리를 저장하고 로드할 수 있어야 한다', async () => {
      const messageHistory: MessageHistory = {
        messageId: '1',
        createdAt: new Date(),
        role: 'user',
        content: {
          contentType: 'text',
          value: 'test message',
        },
      };

      await initMetadata(sessionId);
      await storage.saveMessageHistories(sessionId, [messageHistory]);
      const loadedHistories = await storage.readAll(sessionId);

      expect(loadedHistories).toHaveLength(1);
      expect(loadedHistories[0]).toEqual(messageHistory);
    });

    it('여러 메시지 히스토리를 저장하고 스트리밍으로 로드할 수 있어야 한다', async () => {
      const messageHistories: MessageHistory[] = [
        {
          messageId: '1',
          createdAt: new Date(),
          role: 'user',
          content: {
            contentType: 'text',
            value: 'test message 1',
          },
        },
        {
          messageId: '2',
          createdAt: new Date(),
          role: 'assistant',
          content: {
            contentType: 'text',
            value: 'test message 2',
          },
        },
      ];

      await initMetadata(sessionId);
      await storage.saveMessageHistories(sessionId, messageHistories);
      const loadedHistories: MessageHistory[] = [];

      for await (const history of storage.read(sessionId)) {
        loadedHistories.push(history);
      }

      expect(loadedHistories).toHaveLength(2);
      expect(loadedHistories).toEqual(messageHistories);
    });
  });

  describe('체크포인트 저장 및 로드', () => {
    it('체크포인트를 저장하고 로드할 수 있어야 한다', async () => {
      const checkpoint: Checkpoint = {
        checkpointId: 'test-checkpoint',
        message: {
          messageId: '1',
          createdAt: new Date(),
          role: 'assistant',
          content: {
            contentType: 'text',
            value: 'compressed message',
          },
        },
        createdAt: new Date(),
        upToCreatedAt: new Date(),
      };

      await initMetadata(sessionId);
      await storage.saveCheckpoint(sessionId, checkpoint);
      const loadedCheckpoint = await storage.getCheckpoint(sessionId);

      expect(loadedCheckpoint).toEqual(checkpoint);
    });
  });

  describe('세션 목록 조회', () => {
    it('세션 목록을 조회할 수 있어야 한다', async () => {
      const sessionList = await storage.getSessionList();
      expect(sessionList).toBeInstanceOf(Array);
    });
  });

  async function initMetadata(sessionId: string): Promise<FileBasedSessionMetadata> {
    const metadata: FileBasedSessionMetadata = {
      sessionId,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalMessages: 1,
      totalUsage: {
        totalTokens: 100,
        promptTokens: 50,
        completionTokens: 50,
      },
      latestMessageId: 1,
      title: 'test-title',
      latestSummary: {
        messageId: '1',
        createdAt: new Date(),
        role: 'user',
        content: {
          contentType: 'text',
          value: 'test message',
        },
      },
      recentMessages: [
        {
          messageId: '1',
          createdAt: new Date(),
          role: 'user',
          content: {
            contentType: 'text',
            value: 'test message',
          },
        },
      ],
    };

    await storage.saveSessionMetadata(sessionId, metadata);

    return metadata;
  }
});
