#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { interactiveChat } from './chat';
import { browseHistory } from './history';
import { browseSessions } from './sessions';

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

program
  .command('history')
  .description('Browse chat history for a session')
  .argument('<sessionId>', 'Session ID to load')
  .action(async (sessionId: string) => {
    try {
      await browseHistory(sessionId);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('sessions')
  .description('Browse previous chat sessions')
  .action(async () => {
    try {
      await browseSessions();
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.parse();
