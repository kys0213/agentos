import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { FileMcpToolRepository } from '../file-mcp-tool-repository';
import { McpConfig } from '../../mcp-config';
import { McpToolMetadata } from '../../mcp-types';

describe('FileMcpToolRepository', () => {
  let repository: FileMcpToolRepository;
  let tempDir: string;
  let storagePath: string;

  beforeEach(async () => {
    // 임시 디렉토리 생성
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-repo-test-'));
    storagePath = path.join(tempDir, 'mcp-tools.json');

    repository = new FileMcpToolRepository(storagePath, {
      enableCaching: true,
      enableWatching: false, // 테스트에서는 파일 감시 비활성화
    });
  });

  afterEach(async () => {
    // 임시 디렉토리 정리
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // 정리 실패는 무시
    }
  });

  describe('create', () => {
    it('should create a new MCP tool metadata', async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
        args: ['script.js'],
        env: { API_KEY: 'secret123' },
      };

      const metadata = await repository.create(config);

      expect(metadata).toMatchObject({
        name: 'test-tool',
        version: '1.0.0',
        category: 'general',
        provider: 'Local Process',
        status: 'disconnected',
        usageCount: 0,
      });

      expect(metadata.id).toMatch(/^mcp_test_tool_\d+_[a-z0-9]+$/);
      expect(metadata.endpoint).toBe('node script.js');
      expect(metadata.config?.env?.API_KEY).toBe('***masked***'); // 민감한 정보 마스킹
    });

    it('should infer category from tool name', async () => {
      const webConfig: McpConfig = {
        type: 'streamableHttp',
        name: 'web-search-tool',
        version: '1.0.0',
        url: 'https://api.example.com',
      };

      const metadata = await repository.create(webConfig);
      expect(metadata.category).toBe('search');
    });

    it('should emit changed event on creation', async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };

      const eventPromise = new Promise((resolve) => {
        repository.on?.('changed', resolve);
      });

      const metadata = await repository.create(config);
      const event = await eventPromise;

      expect(event).toEqual({
        id: metadata.id,
        metadata,
      });
    });
  });

  describe('get', () => {
    it('should retrieve existing tool by id', async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };

      const created = await repository.create(config);
      const retrieved = await repository.get(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent tool', async () => {
      const result = await repository.get('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should return empty list initially', async () => {
      const result = await repository.list();

      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBe('');
    });

    it('should return all tools', async () => {
      const configs: McpConfig[] = [
        { type: 'stdio', name: 'tool1', version: '1.0.0', command: 'node' },
        { type: 'stdio', name: 'tool2', version: '1.0.0', command: 'python' },
      ];

      for (const config of configs) {
        await repository.create(config);
      }

      const result = await repository.list();

      expect(result.items).toHaveLength(2);
      expect(result.items.map((t) => t.name)).toContain('tool1');
      expect(result.items.map((t) => t.name)).toContain('tool2');
    });

    it('should support pagination', async () => {
      // 3개 도구 생성
      for (let i = 1; i <= 3; i++) {
        await repository.create({
          type: 'stdio',
          name: `tool${i}`,
          version: '1.0.0',
          command: 'node',
        });
      }

      // 첫 페이지 (limit: 2)
      const firstPage = await repository.list({ limit: 2, cursor: '', direction: 'forward' });
      expect(firstPage.items).toHaveLength(2);
      expect(firstPage.hasMore).toBe(true);
      expect(firstPage.nextCursor).toBeDefined();

      // 두 번째 페이지
      const secondPage = await repository.list({
        limit: 2,
        cursor: firstPage.nextCursor,
        direction: 'forward',
      });
      expect(secondPage.items).toHaveLength(1);
      expect(secondPage.hasMore).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const configs: McpConfig[] = [
        {
          type: 'stdio',
          name: 'web-search',
          version: '1.0.0',
          command: 'node',
          args: ['web-search.js'],
        },
        {
          type: 'streamableHttp',
          name: 'code-executor',
          version: '1.0.0',
          url: 'https://api.codeexec.com',
        },
        {
          type: 'stdio',
          name: 'file-manager',
          version: '1.0.0',
          command: 'python',
          args: ['file_manager.py'],
        },
      ];

      for (const config of configs) {
        await repository.create(config);
      }
    });

    it('should search by category', async () => {
      const result = await repository.search({ category: 'search' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('web-search');
    });

    it('should search by keywords', async () => {
      const result = await repository.search({ keywords: ['code'] });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('code-executor');
    });

    it('should search by multiple criteria', async () => {
      // provider가 'Local Process'이면서 키워드에 'file'이 포함된 도구
      const result = await repository.search({
        provider: 'Local Process',
        keywords: ['file'],
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('file-manager');
    });

    it('should return empty result for no matches', async () => {
      const result = await repository.search({ keywords: ['nonexistent'] });
      expect(result.items).toHaveLength(0);
    });
  });

  describe('update', () => {
    let toolId: string;

    beforeEach(async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };

      const metadata = await repository.create(config);
      toolId = metadata.id;
    });

    it('should update tool metadata', async () => {
      const patch = {
        status: 'connected' as const,
        usageCount: 5,
      };

      const updated = await repository.update(toolId, patch);

      expect(updated.status).toBe('connected');
      expect(updated.usageCount).toBe(5);
      expect(updated.lastUsedAt).toBeInstanceOf(Date);
      expect(updated.version).not.toBe('1.0.0'); // 새 버전 할당됨
    });

    it('should emit statusChanged event on status update', async () => {
      const eventPromise = new Promise((resolve) => {
        repository.on?.('statusChanged', resolve);
      });

      await repository.update(toolId, { status: 'connected' });
      const event = await eventPromise;

      expect(event).toMatchObject({
        id: toolId,
        previousStatus: 'disconnected',
      });
    });

    it('should handle version conflicts', async () => {
      const wrongVersion = 'wrong-version';

      await expect(
        repository.update(
          toolId,
          { status: 'connected' },
          {
            expectedVersion: wrongVersion,
          }
        )
      ).rejects.toThrow(/Version conflict/);
    });

    it('should throw error for non-existent tool', async () => {
      await expect(repository.update('non-existent', { status: 'connected' })).rejects.toThrow(
        /not found/
      );
    });
  });

  describe('delete', () => {
    let toolId: string;

    beforeEach(async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node',
      };

      const metadata = await repository.create(config);
      toolId = metadata.id;
    });

    it('should delete existing tool', async () => {
      await repository.delete(toolId);

      const result = await repository.get(toolId);
      expect(result).toBeNull();
    });

    it('should emit deleted event', async () => {
      const eventPromise = new Promise((resolve) => {
        repository.on?.('deleted', resolve);
      });

      await repository.delete(toolId);
      const event = await eventPromise;

      expect(event).toEqual({ id: toolId });
    });

    it('should throw error for non-existent tool', async () => {
      await expect(repository.delete('non-existent')).rejects.toThrow(/not found/);
    });
  });

  describe('persistence', () => {
    it('should persist data across repository instances', async () => {
      const config: McpConfig = {
        type: 'stdio',
        name: 'persistent-tool',
        version: '1.0.0',
        command: 'node',
      };

      // 첫 번째 인스턴스로 데이터 생성
      const metadata = await repository.create(config);

      // 새 인스턴스 생성
      const newRepository = new FileMcpToolRepository(storagePath);
      const retrieved = await newRepository.get(metadata.id);

      expect(retrieved).toEqual(metadata);
    });
  });
});
