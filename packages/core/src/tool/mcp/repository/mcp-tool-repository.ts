import type { CursorPagination, CursorPaginationResult } from '../../../common/pagination/cursor-pagination';
import type { McpToolMetadata, McpConnectionStatus } from '../mcp-types';
import type { McpConfig } from '../mcp-config';

/**
 * MCP 도구 검색 쿼리
 */
export interface McpToolSearchQuery {
  /** 카테고리별 필터링 */
  category?: string;
  /** 연결 상태별 필터링 */
  status?: McpConnectionStatus;
  /** 제공자별 필터링 */
  provider?: string;
  /** 키워드 검색 (이름, 설명에서 검색) */
  keywords?: string[];
}

/**
 * MCP 도구 메타데이터의 영속화와 검색을 담당하는 Repository 인터페이스
 * 
 * 이 인터페이스는 AgentOS의 SSOT 아키텍처에 따라 설계되었으며,
 * 다양한 저장소 구현체(파일, SQLite, HTTP 등)를 지원합니다.
 */
export interface McpToolRepository {
  /**
   * ID로 특정 도구 메타데이터 조회
   * @param id 도구 고유 식별자
   * @returns 도구 메타데이터 또는 null (존재하지 않는 경우)
   */
  get(id: string): Promise<McpToolMetadata | null>;

  /**
   * 모든 도구 메타데이터 목록 조회 (페이징 지원)
   * @param pagination 페이징 옵션 (옵셔널)
   * @returns 페이징된 도구 메타데이터 목록
   */
  list(pagination?: CursorPagination): Promise<CursorPaginationResult<McpToolMetadata>>;

  /**
   * 조건에 따른 도구 검색 (페이징 지원)
   * @param query 검색 조건
   * @param pagination 페이징 옵션 (옵셔널)
   * @returns 페이징된 검색 결과
   */
  search(
    query: McpToolSearchQuery,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<McpToolMetadata>>;

  /**
   * 새로운 도구 메타데이터 생성
   * @param config MCP 설정으로부터 메타데이터 생성
   * @returns 생성된 도구 메타데이터 (ID, 버전 등 자동 할당)
   */
  create(config: McpConfig): Promise<McpToolMetadata>;

  /**
   * 기존 도구 메타데이터 업데이트
   * @param id 업데이트할 도구 ID
   * @param patch 업데이트할 필드들 (부분 업데이트)
   * @param options 업데이트 옵션
   * @returns 업데이트된 도구 메타데이터
   */
  update(
    id: string,
    patch: Partial<McpToolMetadata>,
    options?: {
      /** 낙관적 동시성 제어를 위한 예상 버전 */
      expectedVersion?: string;
    }
  ): Promise<McpToolMetadata>;

  /**
   * 도구 메타데이터 삭제
   * @param id 삭제할 도구 ID
   */
  delete(id: string): Promise<void>;

  /**
   * 도구 메타데이터 변경 이벤트 구독 (선택적)
   * GUI나 다른 컴포넌트가 실시간으로 변경사항을 반영할 수 있도록 지원
   * 
   * @param event 구독할 이벤트 타입
   * @param handler 이벤트 핸들러
   * @returns 구독 해제 함수
   */
  on?(
    event: 'changed' | 'deleted' | 'statusChanged',
    handler: (payload: {
      id: string;
      metadata?: McpToolMetadata;
      previousStatus?: McpConnectionStatus;
    }) => void
  ): () => void;
}

/**
 * Repository 이벤트 페이로드 타입
 */
export interface McpToolRepositoryEventPayload {
  /** 변경된 도구 ID */
  id: string;
  /** 변경된 메타데이터 (삭제 이벤트의 경우 undefined) */
  metadata?: McpToolMetadata;
  /** 상태 변경 이벤트의 경우 이전 상태 */
  previousStatus?: McpConnectionStatus;
}

/**
 * Repository 이벤트 타입
 */
export type McpToolRepositoryEvent = 'changed' | 'deleted' | 'statusChanged';

/**
 * Repository 이벤트 핸들러 타입
 */
export type McpToolRepositoryEventHandler = (payload: McpToolRepositoryEventPayload) => void;

/**
 * 구독 해제 함수 타입
 */
export type Unsubscribe = () => void;