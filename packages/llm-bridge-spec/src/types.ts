import { Readable } from 'stream';

/**
 * LLM 브릿지의 핵심 인터페이스입니다.
 * 모든 LLM 제공자는 이 인터페이스를 구현해야 합니다.
 */
export interface LlmBridge {
  /**
   * LLM에 프롬프트를 전송하고 응답을 받습니다.
   * @param prompt - 전송할 프롬프트 메시지
   * @param option - 채팅 옵션 설정
   * @returns LLM의 응답
   */
  invoke(prompt: LlmBridgePrompt, option: ChatOption): Promise<LlmBridgeResponse>;

  /**
   * LLM에 프롬프트를 전송하고 스트리밍 응답을 받습니다.
   * @param prompt - 전송할 프롬프트 메시지
   * @param option - 채팅 옵션 설정
   * @returns 스트리밍 응답의 AsyncIterable
   */
  invokeStream?(prompt: LlmBridgePrompt, option: ChatOption): AsyncIterable<LlmBridgeResponse>;

  /**
   * LLM의 메타데이터를 조회합니다.
   * @returns LLM의 메타데이터
   */
  getMetadata(): Promise<LlmMetadata>;

  /**
   * LLM의 기능 지원 여부를 조회합니다.
   * @returns LLM의 기능 지원 정보
   */
  getCapabilities?(): Promise<LlmBridgeCapabilities>;

  /**
   * LLM의 사용량 정보를 조회합니다.
   * @returns 토큰 사용량 정보
   */
  getUsage?(): Promise<LlmUsage>;
}

/**
 * LLM 채팅 요청에 대한 옵션 설정입니다.
 */
export interface ChatOption {
  /** 사용 가능한 도구 목록 */
  tools?: LlmBridgeTool[];
  /** 상위 확률 분포의 임계값 (0.0 ~ 1.0) */
  topP?: number;
  /** 응답의 무작위성 정도 (0.0 ~ 2.0) */
  temperature?: number;
  /** 최대 생성 토큰 수 */
  maxTokens?: number;
  /** 상위 K개의 토큰만 고려 */
  topK?: number;
  /** 빈도 페널티 (중복 방지) */
  frequencyPenalty?: number;
  /** 존재 페널티 (다양성 증가) */
  presencePenalty?: number;
  /** 생성 중단 시퀀스 */
  stopSequence?: string[];
  /** 대화 이력 압축 사용 여부 */
  historyCompression?: boolean;
}

/**
 * LLM에 전송할 프롬프트 구조입니다.
 */
export interface LlmBridgePrompt {
  /** 대화 메시지 목록 */
  messages: ChatMessage[];
}

export type Message = UserMessage | AssistantMessage | SystemMessage | ToolMessage;
/**
 * 대화 메시지의 기본 구조입니다.
 */
export interface ChatMessage {
  /** 메시지 작성자의 역할 */
  role: 'user' | 'assistant' | 'system';
  /** 메시지 내용 (다중 모달 지원) */
  content: MultiModalContent;
}

export interface UserMessage extends ChatMessage {
  role: 'user';
}

export interface AssistantMessage extends ChatMessage {
  role: 'assistant';
}

export interface SystemMessage extends ChatMessage {
  role: 'system';
}

/**
 * 도구 실행 결과 메시지 구조입니다.
 */
export interface ToolMessage {
  /** 도구 메시지 역할 (항상 'tool') */
  role: 'tool';
  /** 실행된 도구의 이름 */
  name: string;
  /** 도구 실행 결과 */
  content: string;
  /** 도구 호출 식별자 */
  toolCallId: string;
}

/**
 * 다중 모달 콘텐츠 타입 정의입니다.
 */
export type MultiModalContent =
  | StringContent
  | ImageContent
  | AudioContent
  | VideoContent
  | FileContent;

/**
 * 텍스트 콘텐츠 구조입니다.
 */
export interface StringContent {
  /** 콘텐츠 타입 (항상 'text') */
  contentType: 'text';
  /** 텍스트 내용 */
  content: string;
}

/**
 * 이미지 콘텐츠 구조입니다.
 */
export interface ImageContent {
  /** 콘텐츠 타입 (항상 'image') */
  contentType: 'image';
  /** 이미지 데이터 */
  content: Buffer | Readable;
}

/**
 * 오디오 콘텐츠 구조입니다.
 */
export interface AudioContent {
  /** 콘텐츠 타입 (항상 'audio') */
  contentType: 'audio';
  /** 오디오 데이터 */
  content: Buffer | Readable;
}

/**
 * 비디오 콘텐츠 구조입니다.
 */
export interface VideoContent {
  /** 콘텐츠 타입 (항상 'video') */
  contentType: 'video';
  /** 비디오 데이터 */
  content: Buffer | Readable;
}

/**
 * 파일 콘텐츠 구조입니다.
 */
export interface FileContent {
  /** 콘텐츠 타입 (항상 'file') */
  contentType: 'file';
  /** 파일 데이터 */
  content: Buffer | Readable;
}

/**
 * LLM의 응답 구조입니다.
 */
export interface LlmBridgeResponse {
  /** 응답 내용 */
  content: MultiModalContent;
  /** 토큰 사용량 정보 */
  usage?: LlmUsage;
  /** 도구 호출 결과 */
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  /** 도구 호출 식별자 */
  toolCallId: string;
  /** 도구 이름 */
  name: string;
  /** 도구 인자 */
  arguments: Record<string, unknown>;
}

/**
 * LLM의 토큰 사용량 정보입니다.
 */
export interface LlmUsage {
  /** 입력 프롬프트의 토큰 수 */
  promptTokens: number;
  /** 생성된 응답의 토큰 수 */
  completionTokens: number;
  /** 전체 토큰 수 */
  totalTokens: number;
}

/**
 * LLM에서 사용 가능한 도구의 정의입니다.
 */
export interface LlmBridgeTool {
  /** 도구 이름 */
  name: string;
  /** 도구 설명 */
  description: string;
  /** 도구 파라미터 스키마 */
  parameters: Record<string, unknown>;
  /** 도구 응답 스키마 */
  response: Record<string, unknown>;
}

/**
 * LLM의 메타데이터 정보입니다.
 */
export interface LlmMetadata extends Record<string, unknown> {
  /** LLM 아이콘 URL */
  icon?: string;
  /** LLM 이름 */
  name: string;
  /** LLM 버전 */
  version: string;
  /** LLM 설명 */
  description: string;
  /** 사용 중인 모델명 */
  model: string;
  /** 컨텍스트 윈도우 크기 (토큰) */
  contextWindow: number;
  /** 최대 생성 토큰 수 */
  maxTokens: number;
}

/**
 * LLM의 기능 지원 정보입니다.
 */
export interface LlmBridgeCapabilities {
  /** 스트리밍 응답 지원 여부 */
  supportsStream: boolean;
  /** 도구 사용 지원 여부 */
  supportsTools: boolean;
  /** 사용량 정보 제공 여부 */
  supportsUsage: boolean;
}

/**
 * LLM 매니페스트 정보입니다.
 */
export interface LlmManifest {
  /** 스키마 버전 */
  schemaVersion: string;
  /** LLM 이름 */
  name: string;
  /** 구현 언어 */
  language: string;
  /** 진입점 파일 경로 */
  entry: string;
  /** 설정 스키마 */
  configSchema: JSONSchema;
  /** 지원 기능 정보 */
  capabilities: LlmBridgeCapabilities;
  /** LLM 설명 */
  description: string;
}

/**
 * JSON 스키마 타입 정의입니다.
 */
export type JSONSchema = {
  /** 스키마 버전 */
  $schema?: string;
  /** 스키마 ID */
  $id?: string;
  /** 데이터 타입 */
  type?: string;
  /** 객체 속성 정의 */
  properties?: Record<string, JSONSchema>;
  /** 배열 아이템 스키마 */
  items?: JSONSchema;
  /** 필수 속성 목록 */
  required?: string[];
  /** 열거형 값 목록 */
  enum?: string[];
  /** 기본값 */
  default?: any;
  /** 설명 */
  description?: string;
  /** 추가 속성 */
  [key: string]: any;
};
