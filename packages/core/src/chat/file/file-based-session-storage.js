"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileBasedSessionStorage = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const file_based_chat_session_check_point_file_1 = require("./file-based-chat-session-check-point-file");
const file_based_chat_session_message_history_file_1 = require("./file-based-chat-session-message-history-file");
const file_based_chat_session_metadata_file_1 = require("./file-based-chat-session-metadata-file");
class FileBasedSessionStorage {
    baseDir;
    // TODO LRU Cache 적용
    dirNameCache = new Map();
    constructor(baseDir) {
        this.baseDir = baseDir;
    }
    async saveMessageHistories(sessionId, messageHistories) {
        const { messageHistory: messageHistoryFile } = await this.resolveSessionDir(sessionId);
        await messageHistoryFile.appendMany(messageHistories);
    }
    async readAll(sessionId) {
        const messageHistories = [];
        for await (const messageHistory of this.read(sessionId)) {
            messageHistories.push(messageHistory);
        }
        return messageHistories;
    }
    async *read(sessionId) {
        const files = await this.resolveSessionDir(sessionId);
        if (!files) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const messageHistoryFile = files.messageHistory;
        for await (const messageHistory of messageHistoryFile.readOrThrow()) {
            yield messageHistory;
        }
    }
    async saveCheckpoint(sessionId, checkpoint) {
        const { checkpoint: checkpointFile } = await this.resolveSessionDir(sessionId);
        await checkpointFile.update(checkpoint);
    }
    async saveSessionMetadata(sessionId, metadata) {
        const { metadata: metaFile } = await this.resolveSessionDir(sessionId);
        await metaFile.update(metadata);
    }
    async getCheckpoint(sessionId) {
        const { checkpoint } = await this.resolveSessionDir(sessionId);
        const data = await checkpoint.read();
        if (!data) {
            return;
        }
        return {
            ...data,
            message: {
                ...data.message,
                createdAt: new Date(data.message.createdAt),
            },
            createdAt: new Date(data.createdAt),
            coveringUpTo: new Date(data.coveringUpTo),
        };
    }
    async getCheckpointOrThrow(sessionId) {
        const checkpoint = await this.getCheckpoint(sessionId);
        if (!checkpoint) {
            throw new Error(`Checkpoint not found: ${sessionId}`);
        }
        return checkpoint;
    }
    async getSessionMetadata(sessionId) {
        const { metadata } = await this.resolveSessionDir(sessionId);
        const meta = await metadata.read();
        return {
            ...meta,
            latestSummary: meta.latestSummary
                ? {
                    ...meta.latestSummary,
                    createdAt: new Date(meta.latestSummary.createdAt),
                }
                : undefined,
            recentMessages: meta.recentMessages.map((message) => ({
                ...message,
                createdAt: new Date(message.createdAt),
            })),
            updatedAt: new Date(meta.updatedAt),
            createdAt: new Date(meta.createdAt),
        };
    }
    /**
     * 세션 디렉토리 목록을 조회하여 ChatSessionDescription 리스트 반환
     */
    async getSessionList() {
        const entries = await promises_1.default.readdir(this.baseDir, { withFileTypes: true });
        const sessionEntries = entries.filter((entry) => entry.isDirectory());
        const sessionList = [];
        for (const entry of sessionEntries) {
            const fullPath = path_1.default.join(this.baseDir, entry.name);
            const cached = this.dirNameCache.get(entry.name);
            const metadataFile = cached
                ? cached.metadata
                : new file_based_chat_session_metadata_file_1.FileBasedChatSessionMetadataFile(fullPath);
            const meta = await metadataFile.read();
            sessionList.push({ id: entry.name, title: meta.title ?? '', updatedAt: meta.updatedAt });
        }
        return sessionList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    /**
     * 특정 세션의 메타 정보 로딩
     */
    async getSessionDescription(sessionId) {
        const files = await this.resolveSessionDir(sessionId);
        if (!files) {
            return null;
        }
        const meta = await files.metadata.read();
        return {
            id: meta.sessionId,
            title: meta.title ?? '',
            updatedAt: new Date(meta.updatedAt),
        };
    }
    async resolveSessionDir(sessionId) {
        const cached = this.dirNameCache.get(sessionId);
        if (cached) {
            return cached;
        }
        const directoryPath = path_1.default.join(this.baseDir, sessionId);
        const metaFile = new file_based_chat_session_metadata_file_1.FileBasedChatSessionMetadataFile(directoryPath);
        const messageHistoryFile = new file_based_chat_session_message_history_file_1.FileBasedChatSessionMessageHistoryFile(directoryPath);
        const checkpointFile = new file_based_chat_session_check_point_file_1.FileBasedChatSessionCheckpointFile(directoryPath);
        if (!(await this.existsDirectory(directoryPath))) {
            await promises_1.default.mkdir(directoryPath, { recursive: true });
            await metaFile.create();
            await messageHistoryFile.create();
            await checkpointFile.create();
        }
        const files = {
            metadata: metaFile,
            messageHistory: messageHistoryFile,
            checkpoint: checkpointFile,
        };
        this.dirNameCache.set(sessionId, files);
        return files;
    }
    async existsDirectory(directoryPath) {
        try {
            const stat = await promises_1.default.stat(directoryPath);
            return stat.isDirectory();
        }
        catch (error) {
            return false;
        }
    }
}
exports.FileBasedSessionStorage = FileBasedSessionStorage;
//# sourceMappingURL=file-based-session-storage.js.map