import { Module } from '@nestjs/common';
import {
  McpRegistry,
  McpMetadataRegistry,
  McpService,
  FileMcpToolRepository,
  FileMcpUsageRepository,
  McpUsageService,
} from '@agentos/core';
import { McpUsagePublisher } from '../../mcp/mcp-usage.publisher';
import { ElectronAppEnvironment } from '../../electron/electron-app.environment';
import * as path from 'path';

@Module({
  providers: [
    McpRegistry,
    {
      provide: FileMcpToolRepository,
      inject: [ElectronAppEnvironment],
      useFactory: (env: ElectronAppEnvironment) =>
        new FileMcpToolRepository(path.join(env.userDataPath, 'mcp-tools.json')),
    },
    {
      provide: McpMetadataRegistry,
      inject: [FileMcpToolRepository, McpRegistry],
      useFactory: (repo: FileMcpToolRepository, registry: McpRegistry) =>
        new McpMetadataRegistry(repo, registry),
    },
    {
      provide: McpService,
      inject: [FileMcpToolRepository, McpMetadataRegistry, McpUsageService],
      useFactory: (
        repo: FileMcpToolRepository,
        meta: McpMetadataRegistry,
        usage: McpUsageService
      ) => new McpService(repo, meta, usage),
    },
    {
      provide: FileMcpUsageRepository,
      inject: [ElectronAppEnvironment],
      useFactory: (env: ElectronAppEnvironment) =>
        new FileMcpUsageRepository(path.join(env.userDataPath, 'mcp-usage.json')),
    },
    {
      provide: McpUsageService,
      inject: [FileMcpUsageRepository],
      useFactory: (repo: FileMcpUsageRepository) => new McpUsageService(repo),
    },
    McpUsagePublisher,
  ],
  exports: [
    McpRegistry,
    McpService,
    McpMetadataRegistry,
    FileMcpToolRepository,
    FileMcpUsageRepository,
    McpUsageService,
  ],
})
export class McpRegistryModule {}
