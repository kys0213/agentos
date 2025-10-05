import process from 'node:process';
import { runSeedCli } from './seed-backend';

const nodeProcess = process as NodeJS.Process;

void (async () => {
  try {
    await runSeedCli(nodeProcess.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    nodeProcess.exit(1);
  }
})();
