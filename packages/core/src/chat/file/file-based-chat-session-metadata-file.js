"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileBasedChatSessionMetadataFile = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class FileBasedChatSessionMetadataFile {
    fileName = 'metadata.json';
    _fullPath;
    constructor(directoryPath) {
        this._fullPath = path_1.default.join(directoryPath, this.fileName);
    }
    get fullPath() {
        return this._fullPath;
    }
    async exists() {
        return promises_1.default
            .access(this._fullPath)
            .then(() => true)
            .catch(() => false);
    }
    async create() {
        await promises_1.default.writeFile(this._fullPath, '');
    }
    async read() {
        if (!(await this.exists())) {
            throw new Error(`Session metadata not found: ${this._fullPath}`);
        }
        const content = await promises_1.default.readFile(this._fullPath, 'utf-8');
        return JSON.parse(content);
    }
    async update(metadata) {
        if (!(await this.exists())) {
            await this.create();
        }
        await promises_1.default.writeFile(this._fullPath, JSON.stringify(metadata));
    }
}
exports.FileBasedChatSessionMetadataFile = FileBasedChatSessionMetadataFile;
//# sourceMappingURL=file-based-chat-session-metadata-file.js.map