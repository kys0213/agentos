import { Module } from '@nestjs/common';
import { McpRegistry, McpMetadataRegistry, McpService, FileMcpToolRepository } from '@agentos/core';
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
      inject: [FileMcpToolRepository, McpMetadataRegistry],
      useFactory: (repo: FileMcpToolRepository, meta: McpMetadataRegistry) =>
        new McpService(repo, meta),
    },
    McpUsagePublisher,
  ],
  exports: [McpRegistry, McpService, McpMetadataRegistry, FileMcpToolRepository],
})
export class McpRegistryModule {}
