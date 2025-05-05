import { mock } from 'jest-mock-extended';
import { LlmUsage, Message } from 'llm-bridge-spec';
import { Checkpoint } from '../../chat-session';
import { FileBasedChatSession } from '../file-based-chat-session';
import { FileBasedSessionStorage } from '../file-based-session-storage';
import { FileBasedSessionMetadata } from '../file-based-session.metadata';

describe('FileBasedChatSession', () => {
  let session: FileBasedChatSession;
  let mockStorage: jest.Mocked<FileBasedSessionStorage>;
  let mockPreset: FileBasedSessionMetadata;

  beforeEach(() => {
    mockStorage = mock<FileBasedSessionStorage>();

    mockPreset = {
      preset: {
        name: 'Test Preset',
        description: 'Test Description',
        author: 'Test Author',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        systemPrompt: 'Test System Prompt',
        enabledMcps: [],
        llmBridgeName: 'test-bridge',
        llmBridgeConfig: {},
      },
      sessionId: 'test-session',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalMessages: 0,
      totalUsage: {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
      },
      latestMessageId: 0,
      recentMessages: [],
      latestSummary: undefined,
      latestCheckpoint: undefined,
    };

    session = new FileBasedChatSession('test-session', mockStorage, mockPreset);
  });

  describe('save', () => {
    it('세션 메타데이터와 메시지 히스토리를 저장해야 한다', async () => {
      const testMessage: Message = {
        role: 'user',
        content: {
          contentType: 'text',
          value: 'test message',
        },
      };

      await session.appendMessage(testMessage);
      await session.save();

      expect(mockStorage.saveSessionMetadata).toHaveBeenCalledWith(
        'test-session',
        expect.any(Object)
      );
      expect(mockStorage.saveMessageHistories).toHaveBeenCalledWith(
        'test-session',
        expect.any(Array)
      );
    });
  });

  describe('appendUsage', () => {
    it('LLM 사용량을 누적해야 한다', async () => {
      const initialUsage: LlmUsage = {
        totalTokens: 100,
        promptTokens: 50,
        completionTokens: 50,
      };

      await session.sumUsage(initialUsage);

      const metadata = await session.getMetadata();
      expect(metadata.totalUsage).toEqual(initialUsage);
    });
  });

  describe('compress', () => {
    it('메시지 히스토리를 압축하고 체크포인트를 생성해야 한다', async () => {
      const mockStrategy = {
        compress: jest.fn().mockResolvedValue({
          role: 'assistant',
          content: {
            contentType: 'text',
            value: 'compressed message',
          },
        }),
      };

      const testMessage: Message = {
        role: 'user',
        content: {
          contentType: 'text',
          value: 'test message',
        },
      };

      await session.appendMessage(testMessage);
      await session.compress(mockStrategy);

      expect(mockStorage.saveMessageHistories).toHaveBeenCalled();
      expect(mockStorage.saveCheckpoint).toHaveBeenCalled();
    });
  });

  describe('getHistories', () => {
    it('메시지 히스토리를 반환해야 한다', async () => {
      const mockHistory = {
        messageId: '1',
        createdAt: new Date(),
        role: 'user',
        content: {
          contentType: 'text',
          value: 'test message',
        },
      };

      mockStorage.read.mockReturnValue({
        next: jest.fn().mockResolvedValue({ done: false, value: mockHistory }),
        return: jest.fn().mockResolvedValue({ done: true, value: undefined }),
        throw: jest.fn().mockResolvedValue({ done: true, value: undefined }),
        [Symbol.asyncIterator]: jest.fn().mockReturnThis(),
      });

      const result = await session.getHistories();
      expect(result.items).toContainEqual(mockHistory);
    });
  });

  describe('getCheckpoints', () => {
    it('체크포인트를 반환해야 한다', async () => {
      const mockCheckpoint: Checkpoint = {
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

      mockStorage.getCheckpoint.mockResolvedValue(mockCheckpoint);

      const result = await session.getCheckpoints();
      expect(result.items).toContainEqual(mockCheckpoint);
    });
  });
});
