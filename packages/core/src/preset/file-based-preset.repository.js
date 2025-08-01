"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileBasedPresetRepository = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class FileBasedPresetRepository {
    baseDir;
    constructor(baseDir) {
        this.baseDir = baseDir;
    }
    async list() {
        await promises_1.default.mkdir(this.baseDir, { recursive: true });
        const entries = await promises_1.default.readdir(this.baseDir);
        const items = [];
        for (const entry of entries) {
            if (!entry.endsWith('.json'))
                continue;
            const preset = await this.get(entry.replace(/\.json$/, ''));
            if (preset) {
                items.push({
                    id: preset.id,
                    name: preset.name,
                    description: preset.description,
                    updatedAt: preset.updatedAt,
                });
            }
        }
        items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        return { items, nextCursor: '' };
    }
    async get(id) {
        try {
            const filePath = this.resolvePath(id);
            const raw = await promises_1.default.readFile(filePath, 'utf-8');
            const data = JSON.parse(raw);
            return {
                ...data,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
            };
        }
        catch {
            return null;
        }
    }
    async create(preset) {
        await this.saveFile(preset.id, preset);
    }
    async update(id, preset) {
        await this.saveFile(id, preset);
    }
    async delete(id) {
        const filePath = this.resolvePath(id);
        await promises_1.default.rm(filePath, { force: true });
    }
    async saveFile(id, preset) {
        await promises_1.default.mkdir(this.baseDir, { recursive: true });
        const filePath = this.resolvePath(id);
        await promises_1.default.writeFile(filePath, JSON.stringify(preset, null, 2), 'utf-8');
    }
    resolvePath(id) {
        return path_1.default.join(this.baseDir, `${id}.json`);
    }
}
exports.FileBasedPresetRepository = FileBasedPresetRepository;
//# sourceMappingURL=file-based-preset.repository.js.map