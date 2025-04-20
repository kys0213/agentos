#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { Agent } from '@agentos/core';

const program = new Command();

program.name('agentos').description('CLI for AgentOS').version('1.0.0');

program
  .command('run')
  .description('Run an agent')
  .argument('<task>', 'Task to execute')
  .action(async (task: string) => {
    try {
      const agent = new Agent({
        name: 'default',
        version: '1.0.0',
      });
      await agent.initialize();
      const result = await agent.execute(task);
      console.log(chalk.green('Result:'), result);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.parse();
