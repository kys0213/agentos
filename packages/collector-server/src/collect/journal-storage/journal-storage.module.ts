import { DynamicModule, Module, Provider } from '@nestjs/common';
import { FilesystemJournalStorageService } from './filesystem-journal-storage.service';
import { JOURNAL_STORAGE } from './journal-storage.constants';
import {
  JournalStorage,
  JournalStorageModuleAsyncOptions,
  JournalStorageModuleOptions,
} from './journal-storage.interface';

@Module({})
export class JournalStorageModule {
  static register(options: JournalStorageModuleOptions): DynamicModule {
    const provider = this.createProvider(options);

    return {
      module: JournalStorageModule,
      providers: provider,
      exports: provider,
    };
  }

  static registerAsync<TArgs extends unknown[]>(
    options: JournalStorageModuleAsyncOptions<TArgs>,
  ): DynamicModule {
    const asyncProvider: Provider = {
      provide: JOURNAL_STORAGE,
      inject: options.inject ?? [],
      useFactory: async (...args: TArgs): Promise<JournalStorage> => {
        const resolved = await options.useFactory(...args);
        return this.instantiate(resolved);
      },
    };

    const providers: Provider[] = [asyncProvider];

    return {
      module: JournalStorageModule,
      imports: options.imports,
      providers,
      exports: providers,
    };
  }

  private static createProvider(options: JournalStorageModuleOptions): Provider[] {
    const storage = this.instantiate(options);
    return [
      {
        provide: JOURNAL_STORAGE,
        useValue: storage,
      },
    ];
  }

  private static instantiate(options: JournalStorageModuleOptions): JournalStorage {
    if (options.driver === 'filesystem') {
      return new FilesystemJournalStorageService(options.filesystem);
    }
    return options.create();
  }
}
