/**
 * Agent 메타데이터 정의
 * 
 * Agent의 기본 속성과 정보를 정의하는 인터페이스들입니다.
 * GUI에서 Agent를 표시하고 관리하기 위한 모든 필요한 정보를 포함합니다.
 */

/**
 * Agent 메타데이터 인터페이스
 * 
 * Agent의 정적 정보를 정의합니다.
 * 이 정보는 Agent 레지스트리에서 관리되며, Agent 선택 및 표시에 사용됩니다.
 */
export interface AgentMetadata {
  /** Agent 고유 식별자 */
  id: string;
  
  /** Agent 이름 (사용자에게 표시되는 이름) */
  name: string;
  
  /** Agent 설명 */
  description: string;
  
  /** Agent 버전 */
  version: string;
  
  /** Agent 아이콘 (URL 또는 이모지) */
  icon: string;
  
  /** Agent 카테고리 */
  category: AgentCategory;
  
  /** 검색용 키워드 */
  keywords: string[];
  
  /** Agent 생성자/제작자 */
  author: string;
  
  /** 생성 시간 */
  createdAt: Date;
  
  /** 수정 시간 */
  updatedAt: Date;
  
  /** Agent가 요구하는 최소 기능들 */
  requiredCapabilities?: string[];
  
  /** Agent가 지원하는 입력 타입들 */
  supportedInputTypes?: InputType[];
  
  /** Agent 우선순위 (높을수록 먼저 표시) */
  priority?: number;
  
  /** Agent 활성화 여부 */
  isEnabled?: boolean;
}

/**
 * Agent 카테고리 타입
 * 
 * Agent를 용도별로 분류하기 위한 카테고리입니다.
 */
export type AgentCategory = 
  | 'general'      // 범용 Agent
  | 'coding'       // 프로그래밍 전용
  | 'analysis'     // 분석/데이터 처리
  | 'creative'     // 창작/디자인
  | 'specialized'  // 특수 목적
  | 'research'     // 연구/조사
  | 'communication' // 커뮤니케이션
  | 'automation';  // 자동화/스크립팅

/**
 * 지원 입력 타입
 * 
 * Agent가 처리할 수 있는 입력 데이터의 타입들입니다.
 */
export type InputType = 
  | 'text'         // 텍스트
  | 'image'        // 이미지
  | 'audio'        // 오디오
  | 'video'        // 비디오
  | 'file'         // 파일
  | 'code';        // 코드

/**
 * Agent 검색 쿼리 인터페이스
 * 
 * Agent를 검색하고 필터링하기 위한 조건들입니다.
 */
export interface AgentSearchQuery {
  /** 키워드 검색 */
  keywords?: string[];
  
  /** 카테고리 필터 */
  categories?: AgentCategory[];
  
  /** 지원 입력 타입 필터 */
  inputTypes?: InputType[];
  
  /** 활성화 상태 필터 */
  isEnabled?: boolean;
  
  /** 제작자 필터 */
  author?: string;
  
  /** 최소 우선순위 */
  minPriority?: number;
}

/**
 * Agent 메타데이터 생성 옵션
 * 
 * 새로운 Agent 메타데이터를 생성할 때 사용하는 옵션들입니다.
 */
export interface CreateAgentMetadataOptions {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: string;
  category: AgentCategory;
  keywords: string[];
  author: string;
  requiredCapabilities?: string[];
  supportedInputTypes?: InputType[];
  priority?: number;
  isEnabled?: boolean;
}

/**
 * Agent 메타데이터 업데이트 옵션
 * 
 * 기존 Agent 메타데이터를 업데이트할 때 사용하는 옵션들입니다.
 * 모든 필드가 optional이며, 제공된 필드만 업데이트됩니다.
 */
export interface UpdateAgentMetadataOptions {
  name?: string;
  description?: string;
  version?: string;
  icon?: string;
  category?: AgentCategory;
  keywords?: string[];
  author?: string;
  requiredCapabilities?: string[];
  supportedInputTypes?: InputType[];
  priority?: number;
  isEnabled?: boolean;
}

/**
 * Agent 메타데이터 팩토리 함수
 * 
 * 새로운 Agent 메타데이터를 생성합니다.
 */
export function createAgentMetadata(options: CreateAgentMetadataOptions): AgentMetadata {
  const now = new Date();
  
  return {
    id: options.id,
    name: options.name,
    description: options.description,
    version: options.version,
    icon: options.icon,
    category: options.category,
    keywords: options.keywords,
    author: options.author,
    createdAt: now,
    updatedAt: now,
    requiredCapabilities: options.requiredCapabilities,
    supportedInputTypes: options.supportedInputTypes,
    priority: options.priority ?? 0,
    isEnabled: options.isEnabled ?? true,
  };
}

/**
 * Agent 메타데이터 업데이트 함수
 * 
 * 기존 Agent 메타데이터를 업데이트합니다.
 */
export function updateAgentMetadata(
  existing: AgentMetadata,
  updates: UpdateAgentMetadataOptions
): AgentMetadata {
  return {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };
}

/**
 * Agent 메타데이터 검색 필터 함수
 * 
 * 주어진 검색 조건에 맞는 Agent인지 확인합니다.
 */
export function matchesSearchQuery(
  metadata: AgentMetadata,
  query: AgentSearchQuery
): boolean {
  // 키워드 검색
  if (query.keywords && query.keywords.length > 0) {
    const searchText = `${metadata.name} ${metadata.description} ${metadata.keywords.join(' ')}`.toLowerCase();
    const hasKeyword = query.keywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
    if (!hasKeyword) return false;
  }
  
  // 카테고리 필터
  if (query.categories && query.categories.length > 0) {
    if (!query.categories.includes(metadata.category)) return false;
  }
  
  // 입력 타입 필터
  if (query.inputTypes && query.inputTypes.length > 0) {
    if (!metadata.supportedInputTypes) return false;
    const hasInputType = query.inputTypes.some(type => 
      metadata.supportedInputTypes!.includes(type)
    );
    if (!hasInputType) return false;
  }
  
  // 활성화 상태 필터
  if (query.isEnabled !== undefined) {
    if (metadata.isEnabled !== query.isEnabled) return false;
  }
  
  // 제작자 필터
  if (query.author) {
    if (metadata.author !== query.author) return false;
  }
  
  // 최소 우선순위 필터
  if (query.minPriority !== undefined) {
    if ((metadata.priority ?? 0) < query.minPriority) return false;
  }
  
  return true;
}