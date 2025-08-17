import {
  AgentManager,
  FileAgentMetadataRepository,
  SimpleAgentManager,
  SimpleAgentService,
} from '@agentos/core';
import { Module } from '@nestjs/common';
import * as path from 'path';
import { ElectronAppEnvironment } from '../../electron/electron-app.environment';
import { McpRegistryModule } from '../mcp/mcp-registry.module';
import {
  AGENT_MANAGER_TOKEN,
  AGENT_METADATA_REPOSITORY_TOKEN,
  AGENT_SERVICE_TOKEN,
} from './constants';

@Module({
  imports: [McpRegistryModule],
  providers: [
    {
      provide: AGENT_METADATA_REPOSITORY_TOKEN,
      inject: [ElectronAppEnvironment],
      useFactory: (env: ElectronAppEnvironment) =>
        new FileAgentMetadataRepository(path.join(env.userDataPath, 'agents')),
    },
    { provide: AGENT_MANAGER_TOKEN, useClass: SimpleAgentManager },
    {
      provide: AGENT_SERVICE_TOKEN,
      inject: [AGENT_MANAGER_TOKEN],
      useFactory: (agentManager: AgentManager) => new SimpleAgentService(agentManager),
    },
  ],
  exports: [AGENT_SERVICE_TOKEN, AGENT_METADATA_REPOSITORY_TOKEN, AGENT_MANAGER_TOKEN],
})
export class AgentCoreModule {}
