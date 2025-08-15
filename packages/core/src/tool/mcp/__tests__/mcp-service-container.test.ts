import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { McpServiceContainer, createMcpServices, createMcpServicesFromEnv } from '../mcp-service-container';
import { McpService } from '../service/mcp-service';
import { McpRegistry } from '../registry/mcp-registry';
import { FileMcpToolRepository } from '../repository/file-mcp-tool-repository';
import { McpConfig } from '../mcp-config';
import { McpToolMetadata } from '../mcp-types';

describe('McpServiceContainer', () => {
  let tempDir: string;
  let container: McpServiceContainer;

  beforeEach(async () => {
    // 각 테스트마다 임시 디렉토리 생성
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-container-test-'));
  });

  afterEach(async () => {
    // 컨테이너 정리 (싱글톤 정리)
    try {
      McpServiceContainer.getInstance().dispose();
    } catch {
      // 인스턴스가 없으면 무시
    }

    // 임시 디렉토리 정리
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // 정리 실패는 무시
    }
  });

  describe('container lifecycle', () => {
    it('should create singleton instance', () => {
      const container1 = McpServiceContainer.create({ storageDir: tempDir });
      const container2 = McpServiceContainer.getInstance();

      expect(container1).toBe(container2);
    });

    it('should throw error when accessing uninitialized instance', () => {
      expect(() => McpServiceContainer.getInstance()).toThrow(/not initialized/);
    });

    it('should initialize all services', async () => {
      container = McpServiceContainer.create({ storageDir: tempDir });
      await container.initialize();

      const status = container.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.serviceReady).toBe(true);
      expect(status.registryReady).toBe(true);
      expect(status.repositoryReady).toBe(true);
      expect(status.storageDir).toBe(tempDir);
    });

    it('should provide access to all service instances', async () => {
      container = McpServiceContainer.create({ storageDir: tempDir });
      await container.initialize();

      const mcpService = container.getMcpService();
      const mcpRegistry = container.getMcpRegistry();
      const mcpRepository = container.getMcpRepository();

      expect(mcpService).toBeInstanceOf(McpService);
      expect(mcpRegistry).toBeInstanceOf(McpRegistry);
      expect(mcpRepository).toBeInstanceOf(FileMcpToolRepository);
    });

    it('should throw error when accessing services before initialization', () => {
      container = McpServiceContainer.create({ storageDir: tempDir });

      expect(() => container.getMcpService()).toThrow(/not initialized/);
      expect(() => container.getMcpRegistry()).toThrow(/not initialized/);
      expect(() => container.getMcpRepository()).toThrow(/not initialized/);
    });

    it('should dispose properly', async () => {
      container = McpServiceContainer.create({ storageDir: tempDir });
      await container.initialize();

      container.dispose();

      const status = container.getStatus();
      expect(status.initialized).toBe(false);

      // 새로운 인스턴스 생성 가능
      const newContainer = McpServiceContainer.create({ storageDir: tempDir });
      expect(newContainer).not.toBe(container);
    });
  });

  describe('service integration', () => {
    beforeEach(async () => {
      container = McpServiceContainer.create({ 
        storageDir: tempDir,
        repositoryOptions: {
          enableCaching: true,
          enableWatching: false
        }
      });
      await container.initialize();
    });

    it('should integrate all layers correctly', async () => {
      const mcpService = container.getMcpService();

      // 도구 등록 (Service → Registry → Repository)
      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };

      const tool = await mcpService.registerTool(config);

      // 모든 레이어에서 조회 가능한지 확인
      const serviceResult = mcpService.getTool(tool.id);
      const registryResult = container.getMcpRegistry().getTool(tool.id);
      const repositoryResult = await container.getMcpRepository().get(tool.id);

      expect(serviceResult).toEqual(tool);
      expect(registryResult).toEqual(tool);
      expect(repositoryResult).toEqual(tool);
    });

    it('should propagate events across layers', async () => {
      const mcpService = container.getMcpService();
      const events: string[] = [];

      // Service 레벨 이벤트 구독
      mcpService.on('toolAdded', () => events.push('service:toolAdded'));
      mcpService.on('operationCompleted', () => events.push('service:operationCompleted'));

      // Registry 레벨 이벤트 구독  
      container.getMcpRegistry().on('toolAdded', () => events.push('registry:toolAdded'));

      const config: McpConfig = {
        type: 'stdio',
        name: 'test-tool',
        version: '1.0.0',
        command: 'node'
      };

      await mcpService.registerTool(config);

      expect(events).toContain('service:toolAdded');
      expect(events).toContain('service:operationCompleted');
      expect(events).toContain('registry:toolAdded');
    });

    it('should handle complex workflows', async () => {
      const mcpService = container.getMcpService();

      // 1. 여러 도구 등록
      const configs: McpConfig[] = [
        { type: 'stdio', name: 'tool1', version: '1.0.0', command: 'node' },
        { type: 'streamableHttp', name: 'tool2', version: '1.0.0', url: 'https://api.example.com' },
        { type: 'stdio', name: 'tool3', version: '1.0.0', command: 'python' }
      ];

      const tools: McpToolMetadata[] = [];
      for (const config of configs) {
        const tool = await mcpService.registerTool(config);
        tools.push(tool);
      }

      // 2. 상태 업데이트
      await mcpService.updateConnectionStatus(tools[0].id, 'connected');
      await mcpService.updateConnectionStatus(tools[1].id, 'pending');

      // 3. 사용량 증가
      await mcpService.incrementUsage(tools[0].id);
      await mcpService.incrementUsage(tools[0].id);

      // 4. 통계 확인
      const stats = mcpService.getStatistics();
      expect(stats.total).toBe(3);
      expect(stats.connected).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.disconnected).toBe(1);

      // 5. 도구 제거
      await mcpService.unregisterTool(tools[2].id);

      // 6. 최종 상태 확인
      expect(mcpService.totalToolsCount).toBe(2);
      expect(mcpService.getTool(tools[2].id)).toBeNull();
    });
  });

  describe('factory functions', () => {
    it('should create services with createMcpServices', async () => {
      const mcpService = await createMcpServices({
        storageDir: tempDir,
        repositoryOptions: {
          enableCaching: false,
          enableWatching: false
        }
      });

      expect(mcpService).toBeInstanceOf(McpService);
      expect(mcpService.totalToolsCount).toBe(0);

      // 정리
      McpServiceContainer.getInstance().dispose();
    });

    it('should create services from environment variables', async () => {
      // 환경변수 설정
      const originalEnv = process.env.MCP_STORAGE_DIR;
      process.env.MCP_STORAGE_DIR = tempDir;

      try {
        const mcpService = await createMcpServicesFromEnv();

        expect(mcpService).toBeInstanceOf(McpService);
        
        // 정리
        McpServiceContainer.getInstance().dispose();
      } finally {
        // 환경변수 복원
        if (originalEnv !== undefined) {
          process.env.MCP_STORAGE_DIR = originalEnv;
        } else {
          delete process.env.MCP_STORAGE_DIR;
        }
      }
    });

    it('should use default storage directory when env var not set', async () => {
      // 환경변수 제거
      const originalEnv = process.env.MCP_STORAGE_DIR;
      delete process.env.MCP_STORAGE_DIR;

      try {
        const mcpService = await createMcpServicesFromEnv();

        expect(mcpService).toBeInstanceOf(McpService);

        const container = McpServiceContainer.getInstance();
        const status = container.getStatus();
        expect(status.storageDir).toContain('.agentos/mcp');

        // 정리
        container.dispose();
      } finally {
        // 환경변수 복원
        if (originalEnv !== undefined) {
          process.env.MCP_STORAGE_DIR = originalEnv;
        }
      }
    });
  });

  describe('error handling', () => {
    it('should handle storage directory creation', async () => {
      const nonExistentParent = path.join(tempDir, 'nested', 'deep', 'path');
      
      container = McpServiceContainer.create({ storageDir: nonExistentParent });
      
      // 초기화가 성공해야 함 (디렉토리 자동 생성)
      await expect(container.initialize()).resolves.toBeUndefined();
    });

    it('should provide meaningful error messages', async () => {
      container = McpServiceContainer.create({ storageDir: tempDir });
      
      // 초기화 전에 서비스 접근
      expect(() => container.getMcpService())
        .toThrow('MCP services are not initialized. Call initialize() first.');
    });
  });

  describe('persistence', () => {
    it('should persist data across container restarts', async () => {
      // 첫 번째 컨테이너로 도구 생성
      const container1 = McpServiceContainer.create({ storageDir: tempDir });
      await container1.initialize();

      const config: McpConfig = {
        type: 'stdio',
        name: 'persistent-tool',
        version: '1.0.0',
        command: 'node'
      };

      const tool = await container1.getMcpService().registerTool(config);
      container1.dispose();

      // 두 번째 컨테이너로 데이터 복원
      const container2 = McpServiceContainer.create({ storageDir: tempDir });
      await container2.initialize();

      const restoredTool = container2.getMcpService().getTool(tool.id);
      expect(restoredTool).toEqual(tool);

      container2.dispose();
    });
  });
});