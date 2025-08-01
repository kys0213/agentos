"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileBasedChatSessionCheckpointFile = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class FileBasedChatSessionCheckpointFile {
    fileName = 'checkpoint.json';
    _fullPath;
    constructor(directoryPath) {
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
    async read() {
        if (!(await this.exists())) {
            return;
        }
        const content = await promises_1.default.readFile(this.fullPath, 'utf-8');
        return JSON.parse(content);
    }
    async readOrThrow() {
        const checkpoint = await this.read();
        if (!checkpoint) {
            throw new Error(`Checkpoint not found: ${this.fullPath}`);
        }
        return checkpoint;
    }
    async update(checkpoint) {
        if (!(await this.exists())) {
            await this.create();
        }
        await promises_1.default.writeFile(this.fullPath, JSON.stringify(checkpoint));
    }
}
exports.FileBasedChatSessionCheckpointFile = FileBasedChatSessionCheckpointFile;
//# sourceMappingURL=file-based-chat-session-check-point-file.js.map