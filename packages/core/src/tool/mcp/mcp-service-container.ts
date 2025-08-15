import * as path from 'node:path';
import { McpService } from './service/mcp-service';
import { McpRegistry } from './registry/mcp-registry';
import { FileMcpToolRepository } from './repository/file-mcp-tool-repository';
import type { McpToolRepository } from './repository/mcp-tool-repository';

/**
 * MCP 서비스 컨테이너 설정
 * 
 * 이 클래스는 MCP 서비스 생태계의 의존성 주입을 담당하며,
 * AgentOS 아키텍처에 따라 서비스들을 적절히 조립합니다.
 */
export class McpServiceContainer {
  private static instance: McpServiceContainer | null = null;
  private mcpService: McpService | null = null;
  private mcpRegistry: McpRegistry | null = null;
  private mcpRepository: McpToolRepository | null = null;

  private constructor(
    private readonly options: {
      /** MCP 도구 메타데이터 저장 경로 */
      storageDir: string;
      /** Repository 옵션 */
      repositoryOptions?: {
        enableCaching?: boolean;
        enableWatching?: boolean;
      };
    }
  ) {}

  /**
   * 싱글톤 인스턴스 생성
   */
  static create(options: {
    storageDir: string;
    repositoryOptions?: {
      enableCaching?: boolean;
      enableWatching?: boolean;
    };
  }): McpServiceContainer {
    if (!McpServiceContainer.instance) {
      McpServiceContainer.instance = new McpServiceContainer(options);
    }
    return McpServiceContainer.instance;
  }

  /**
   * 싱글톤 인스턴스 조회
   */
  static getInstance(): McpServiceContainer {
    if (!McpServiceContainer.instance) {
      throw new Error('McpServiceContainer is not initialized. Call create() first.');
    }
    return McpServiceContainer.instance;
  }

  /**
   * 컨테이너 초기화 및 서비스 등록
   */
  async initialize(): Promise<void> {
    // Repository 생성
    this.mcpRepository = new FileMcpToolRepository(
      path.join(this.options.storageDir, 'mcp-tools.json'),
      {
        enableCaching: true,
        enableWatching: false,
        ...this.options.repositoryOptions
      }
    );

    // Registry 생성 (Repository 의존성 주입)
    this.mcpRegistry = new McpRegistry(this.mcpRepository);

    // Service 생성 (Repository와 Registry 의존성 주입)
    this.mcpService = new McpService(this.mcpRepository, this.mcpRegistry);

    // 서비스 초기화
    await this.mcpService.initialize();
  }

  /**
   * MCP 서비스 인스턴스 조회
   */
  getMcpService(): McpService {
    if (!this.mcpService) {
      throw new Error('MCP services are not initialized. Call initialize() first.');
    }
    return this.mcpService;
  }

  /**
   * MCP Registry 인스턴스 조회
   */
  getMcpRegistry(): McpRegistry {
    if (!this.mcpRegistry) {
      throw new Error('MCP services are not initialized. Call initialize() first.');
    }
    return this.mcpRegistry;
  }

  /**
   * MCP Repository 인스턴스 조회
   */
  getMcpRepository(): McpToolRepository {
    if (!this.mcpRepository) {
      throw new Error('MCP services are not initialized. Call initialize() first.');
    }
    return this.mcpRepository;
  }

  /**
   * 컨테이너 정리 (테스트용)
   */
  dispose(): void {
    this.mcpService = null;
    this.mcpRegistry = null;
    this.mcpRepository = null;
    McpServiceContainer.instance = null;
  }

  /**
   * 전체 서비스 상태 확인
   */
  getStatus(): {
    initialized: boolean;
    serviceReady: boolean;
    registryReady: boolean;
    repositoryReady: boolean;
    storageDir: string;
  } {
    return {
      initialized: !!this.mcpService && !!this.mcpRegistry && !!this.mcpRepository,
      serviceReady: !!this.mcpService,
      registryReady: !!this.mcpRegistry,
      repositoryReady: !!this.mcpRepository,
      storageDir: this.options.storageDir
    };
  }
}

/**
 * 기본 MCP 서비스 팩토리 헬퍼
 * 
 * 사용 예:
 * ```typescript
 * import { createMcpServices } from './mcp-service-container';
 * 
 * const mcpService = await createMcpServices({
 *   storageDir: '/path/to/mcp/storage'
 * });
 * ```
 */
export async function createMcpServices(options: {
  storageDir: string;
  repositoryOptions?: {
    enableCaching?: boolean;
    enableWatching?: boolean;
  };
}): Promise<McpService> {
  const container = McpServiceContainer.create(options);
  await container.initialize();
  return container.getMcpService();
}

/**
 * 환경변수 기반 기본 설정으로 MCP 서비스 생성
 * 
 * 사용할 환경변수:
 * - MCP_STORAGE_DIR: MCP 도구 메타데이터 저장 디렉토리
 */
export async function createMcpServicesFromEnv(): Promise<McpService> {
  const storageDir = process.env.MCP_STORAGE_DIR || path.join(process.cwd(), '.agentos', 'mcp');
  
  return createMcpServices({
    storageDir,
    repositoryOptions: {
      enableCaching: true,
      enableWatching: process.env.NODE_ENV !== 'test'
    }
  });
}