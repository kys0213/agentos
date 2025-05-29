#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { Agent } from '@agentos/core';
import { interactiveChat, listSessions } from './chat';

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

const chat = program.command('chat').description('Chat commands');

chat
  .command('new')
  .description('Start a new interactive chat session')
  .action(async () => {
    try {
      await interactiveChat();
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

chat
  .command('list')
  .description('List previous chat sessions')
  .action(async () => {
    try {
      await listSessions();
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.parse();

