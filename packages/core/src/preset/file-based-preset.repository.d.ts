import { CursorPaginationResult } from '../common/pagination/cursor-pagination';
import { Preset } from './preset';
import { PresetRepository, PresetSummary } from './preset.repository';
export declare class FileBasedPresetRepository implements PresetRepository {
    private readonly baseDir;
    constructor(baseDir: string);
    list(): Promise<CursorPaginationResult<PresetSummary>>;
    get(id: string): Promise<Preset | null>;
    create(preset: Preset): Promise<void>;
    update(id: string, preset: Preset): Promise<void>;
    delete(id: string): Promise<void>;
    private saveFile;
    private resolvePath;
}
//# sourceMappingURL=file-based-preset.repository.d.ts.map