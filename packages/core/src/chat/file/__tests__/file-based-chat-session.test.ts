import { mock } from 'jest-mock-extended';
import { LlmUsage, Message } from 'llm-bridge-spec';
import { Checkpoint, CompressStrategy, MessageHistory } from '../../chat-session';
import { FileBasedChatSession } from '../file-based-chat-session';
import { FileBasedSessionStorage } from '../file-based-session-storage';
import { FileBasedSessionMetadata } from '../file-based-session.metadata';

describe('FileBasedChatSession', () => {
  let session: FileBasedChatSession;
  let mockStorage: jest.Mocked<FileBasedSessionStorage>;
  let mockPreset: FileBasedSessionMetadata;
  let mockTitleCompressor: jest.Mocked<CompressStrategy>;
  let mockHistoryCompressor: jest.Mocked<CompressStrategy>;

  beforeEach(() => {
    mockStorage = mock<FileBasedSessionStorage>();
    mockTitleCompressor = mock<CompressStrategy>();
    mockTitleCompressor.compress.mockResolvedValue({
      summary: {
        role: 'system',
        content: [
          {
            contentType: 'text',
            value: 'compressed message',
          },
        ],
      },
      compressedCount: 1,
    });

    mockHistoryCompressor = mock<CompressStrategy>();
    mockHistoryCompressor.compress.mockResolvedValue({
      summary: {
        role: 'system',
        content: [
          {
            contentType: 'text',
            value: 'compressed message',
          },
        ],
      },
      compressedCount: 1,
    });

    mockPreset = {
      agentId: 'a-1',
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
      joinedAgents: [],
    };

    session = new FileBasedChatSession(
      'test-session',
      mockStorage,
      mockPreset,
      mockHistoryCompressor,
      mockTitleCompressor
    );
  });

  describe('save', () => {
    it('세션 메타데이터와 메시지 히스토리를 저장해야 한다', async () => {
      const testMessage: Message = {
        role: 'user',
        content: [
          {
            contentType: 'text',
            value: 'test message',
          },
        ],
      };

      await session.appendMessage(testMessage);
      await session.commit();

      expect(mockStorage.saveSessionMetadata).toHaveBeenCalledWith(
        expect.any(String),
        'test-session',
        expect.any(Object)
      );
      expect(mockStorage.saveMessageHistories).toHaveBeenCalledWith(
        expect.any(String),
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
      const testMessage: Message = {
        role: 'user',
        content: [
          {
            contentType: 'text',
            value: 'test message',
          },
        ],
      };

      await session.appendMessage(testMessage);
      await session.commit();

      expect(mockStorage.saveMessageHistories).toHaveBeenCalled();
      expect(mockStorage.saveCheckpoint).toHaveBeenCalled();
    });

    it('커밋 시 체크포인트 메타데이터가 정확해야 한다', async () => {
      const firstCreatedAt = new Date();
      const testMessages: Message[] = [
        { role: 'user', content: [{ contentType: 'text', value: 'm1' }] },
        { role: 'assistant', content: [{ contentType: 'text', value: 'm2' }] },
        {
          role: 'tool',
          name: 'dummy',
          toolCallId: 'tc-1',
          content: [
            { contentType: 'text', value: 't1' },
            { contentType: 'file', value: Buffer.from('b') },
          ],
        },
      ];

      // 첫 메시지 생성 시각 고정
      jest.useFakeTimers();
      jest.setSystemTime(firstCreatedAt);
      await session.appendMessage(testMessages[0]);
      await session.appendMessage(testMessages[1]);
      await session.appendMessage(testMessages[2]);

      await session.commit();
      jest.useRealTimers();

      expect(mockStorage.saveCheckpoint).toHaveBeenCalledWith(
        expect.any(String),
        'test-session',
        expect.objectContaining({
          checkpointId: expect.any(String),
          message: expect.objectContaining({
            role: 'system',
            content: expect.arrayContaining([
              expect.objectContaining({ contentType: 'text', value: 'compressed message' }),
            ]),
          }),
          coveringUpTo: firstCreatedAt,
        })
      );
    });
  });

  describe('tool message (array content)', () => {
    it('배열 콘텐츠를 가진 tool 메시지를 저장해야 한다', async () => {
      const toolMessage: Message = {
        role: 'tool',
        name: 'dummy-tool',
        toolCallId: 'tc-1',
        content: [
          { contentType: 'text', value: 'result text' },
          { contentType: 'file', value: Buffer.from('file-bytes') },
        ],
      } as Message;

      await session.appendMessage(toolMessage);
      await session.commit();

      expect(mockStorage.saveMessageHistories).toHaveBeenCalledWith(
        expect.any(String),
        'test-session',
        expect.arrayContaining([
          expect.objectContaining({
            role: 'tool',
            content: expect.arrayContaining([
              { contentType: 'text', value: 'result text' },
              expect.objectContaining({ contentType: 'file' }),
            ]),
          }),
        ])
      );
    });
  });

  describe('getHistories', () => {
    it('메시지 히스토리를 반환해야 한다', async () => {
      const mockHistory: MessageHistory = {
        messageId: '1',
        createdAt: new Date(),
        role: 'user',
        content: [
          {
            contentType: 'text',
            value: 'test message',
          },
        ],
      };

      mockStorage.read.mockReturnValue(
        (async function* (): AsyncGenerator<MessageHistory, void, unknown> {
          yield mockHistory;
        })()
      );

      const result = await session.getHistories();
      expect(result.items).toContainEqual(mockHistory);
    });

    it('cursor와 limit을 사용해 페이지네이션을 적용해야 한다', async () => {
      const histories: MessageHistory[] = [
        {
          messageId: '1',
          createdAt: new Date(),
          role: 'user',
          content: [{ contentType: 'text', value: 'm1' }],
        },
        {
          messageId: '2',
          createdAt: new Date(),
          role: 'assistant',
          content: [{ contentType: 'text', value: 'm2' }],
        },
        {
          messageId: '3',
          createdAt: new Date(),
          role: 'user',
          content: [{ contentType: 'text', value: 'm3' }],
        },
        {
          messageId: '4',
          createdAt: new Date(),
          role: 'assistant',
          content: [{ contentType: 'text', value: 'm4' }],
        },
      ];

      mockStorage.read.mockImplementation(async function* () {
        for (const h of histories) {
          yield h;
        }
      });

      const result = await session.getHistories({ cursor: '1', limit: 2, direction: 'forward' });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual(histories[1]);
      expect(result.items[1]).toEqual(histories[2]);
      expect(result.nextCursor).toBe('3');
    });

    it('커밋 후 페이지네이션에서도 배열 콘텐츠가 유지되어야 한다', async () => {
      const msgs: Message[] = [
        { role: 'user', content: [{ contentType: 'text', value: 'u' }] },
        { role: 'assistant', content: [{ contentType: 'text', value: 'a1' }] },
        {
          role: 'tool',
          name: 'dummy',
          toolCallId: 'tc-1',
          content: [
            { contentType: 'text', value: 'tool-text' },
            { contentType: 'file', value: Buffer.from('bytes') },
          ],
        },
        { role: 'assistant', content: [{ contentType: 'text', value: 'a2' }] },
      ];

      for (const m of msgs) {
        await session.appendMessage(m);
      }
      await session.commit();

      // saveMessageHistories로 전달된 데이터를 기반으로 read() 동작을 흉내냄
      const calls = mockStorage.saveMessageHistories.mock.calls;
      const flushed = calls[0][2] as Readonly<MessageHistory>[];
      mockStorage.read.mockImplementation(async function* () {
        for (const h of flushed) {
          yield h;
        }
      });

      const page = await session.getHistories({ cursor: '1', limit: 2, direction: 'forward' });
      expect(page.items.map((i) => i.role)).toEqual(['tool', 'assistant']);
      const toolMsg = page.items[0];
      if (Array.isArray(toolMsg.content)) {
        const arr = toolMsg.content;
        expect(arr[0]).toEqual({ contentType: 'text', value: 'tool-text' });
        expect((arr[1] as { contentType: string }).contentType).toBe('file');
        const fileVal = (arr[1] as { value: Buffer | { type?: string } }).value;
        expect(
          Buffer.isBuffer(fileVal) || (fileVal && (fileVal as { type?: string }).type === 'Buffer')
        ).toBe(true);
      } else {
        throw new Error('content should be array');
      }
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
          content: [
            {
              contentType: 'text',
              value: 'compressed message',
            },
          ],
        },
        createdAt: new Date(),
        coveringUpTo: new Date(),
      };

      mockStorage.getCheckpoint.mockResolvedValue(mockCheckpoint);

      const result = await session.getCheckpoints();
      expect(result.items).toContainEqual(mockCheckpoint);
    });
  });
});
