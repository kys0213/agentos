import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { FileBasedThreadCheckpointStore } from '../thread-checkpoint-store';
import { Checkpoint } from '@agentos/core';

describe('FileBasedThreadCheckpointStore', () => {
  const base = path.join(tmpdir(), 'thread-checkpoint-store');
  let store: FileBasedThreadCheckpointStore;
  const checkpoint: Checkpoint = {
    checkpointId: 'cp1',
    message: {
      messageId: '1',
      createdAt: new Date(),
      role: 'user',
      content: [{ contentType: 'text', value: 'hi' }],
    },
    createdAt: new Date(),
    coveringUpTo: new Date(),
  };

  beforeEach(async () => {
    await fs.rm(base, { recursive: true, force: true });
    store = new FileBasedThreadCheckpointStore(base);
  });

  test('save and get checkpoint', async () => {
    await store.saveCheckpoint('C1', '123.1', checkpoint);
    const loaded = await store.getCheckpoint('C1', '123.1');
    expect(loaded).toEqual(checkpoint);
  });
});
