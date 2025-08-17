import { Module } from '@nestjs/common';
import { McpRegistry } from '@agentos/core';

@Module({
  providers: [McpRegistry],
  exports: [McpRegistry],
})
export class McpRegistryModule {}
