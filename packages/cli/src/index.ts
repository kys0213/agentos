#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { SimpleAgent } from '@agentos/core';
import { interactiveChat } from './chat';

const program = new Command();

program.name('agentos').description('CLI for AgentOS').version('1.0.0');

program
  .command('run')
  .description('Run an agent')
  .argument('<task>', 'Task to execute')
  .action(async (task: string) => {
    console.log(chalk.yellow('run command not implemented'), task);
  });

program
  .command('chat')
  .description('Start an interactive chat session')
  .action(async () => {
    try {
      await interactiveChat();
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.parse();
