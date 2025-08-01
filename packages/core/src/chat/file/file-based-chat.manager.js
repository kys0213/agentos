"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileBasedChatManager = void 0;
const uuid_1 = require("../../common/utils/uuid");
const file_based_chat_session_1 = require("./file-based-chat-session");
class FileBasedChatManager {
    storage;
    historyCompressor;
    titleCompressor;
    constructor(storage, historyCompressor, titleCompressor) {
        this.storage = storage;
        this.historyCompressor = historyCompressor;
        this.titleCompressor = titleCompressor;
    }
    async list(options) {
        const sessionList = await this.storage.getSessionList();
        const filtered = sessionList.filter((session) => {
            if (options?.cursor) {
                return session.id > options.cursor;
            }
            return true;
        });
        return {
            items: filtered,
            nextCursor: filtered.at(-1)?.id ?? '',
        };
    }
    async create(options) {
        const sessionId = (0, uuid_1.uuid)();
        const metadata = {
            sessionId: sessionId,
            createdAt: new Date(),
            updatedAt: new Date(),
            preset: options?.preset,
            latestMessageId: 0,
            totalMessages: 0,
            totalUsage: {
                totalTokens: 0,
                promptTokens: 0,
                completionTokens: 0,
            },
            recentMessages: [],
            latestSummary: undefined,
            latestCheckpoint: undefined,
        };
        return new file_based_chat_session_1.FileBasedChatSession(sessionId, this.storage, metadata, this.historyCompressor, this.titleCompressor);
    }
    async load(options) {
        const metadata = await this.storage.getSessionMetadata(options.sessionId);
        const chatSession = new file_based_chat_session_1.FileBasedChatSession(metadata.sessionId, this.storage, metadata, this.historyCompressor, this.titleCompressor);
        return chatSession;
    }
}
exports.FileBasedChatManager = FileBasedChatManager;
//# sourceMappingURL=file-based-chat.manager.js.map