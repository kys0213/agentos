"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileBasedChatSessionMessageHistoryFile = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const parseJson_1 = require("../../common/utils/parseJson");
const readline_1 = __importDefault(require("readline"));
class FileBasedChatSessionMessageHistoryFile {
    directoryPath;
    fileName = 'histories.jsonl';
    _fullPath;
    constructor(directoryPath) {
        this.directoryPath = directoryPath;
        this._fullPath = path_1.default.join(directoryPath, this.fileName);
    }
    get fullPath() {
        return this._fullPath;
    }
    async exists() {
        return promises_1.default
            .access(this.fullPath)
            .then(() => true)
            .catch(() => false);
    }
    async create() {
        await promises_1.default.writeFile(this.fullPath, '');
    }
    async appendMany(messageHistories) {
        if (!(await this.exists())) {
            await this.create();
        }
        const file = await promises_1.default.open(this.fullPath, 'a');
        try {
            const lines = messageHistories.map((m) => JSON.stringify(m)).join('\n') + '\n';
            await file.write(lines);
        }
        finally {
            await file.close();
        }
    }
    async *readOrThrow(options) {
        if (!(await this.exists())) {
            throw new Error(`Message history file not found: ${this.fullPath}`);
        }
        const { chunkSize = 5 } = options ?? {};
        const file = await promises_1.default.open(this.fullPath, 'r');
        try {
            const rl = readline_1.default.createInterface({
                input: file.createReadStream(),
                crlfDelay: Infinity,
            });
            const buffer = [];
            for await (const line of rl) {
                const messageHistory = (0, parseJson_1.parseJson)(line);
                buffer.push({
                    ...messageHistory,
                    createdAt: new Date(messageHistory.createdAt),
                });
                if (buffer.length >= chunkSize) {
                    yield* buffer;
                    buffer.length = 0;
                }
            }
            if (buffer.length > 0) {
                yield* buffer;
            }
        }
        finally {
            await file.close();
        }
    }
}
exports.FileBasedChatSessionMessageHistoryFile = FileBasedChatSessionMessageHistoryFile;
//# sourceMappingURL=file-based-chat-session-message-history-file.js.map