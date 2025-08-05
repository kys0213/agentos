/**
 * Agent 메타데이터
 */
export interface AgentMetadata {
  /** Agent 고유 식별자 */
  readonly id: string;

  /** Agent 이름 */
  readonly name: string;

  /** Agent 설명 */
  readonly description: string;

  /** Agent 아이콘 (이모지 또는 아이콘 이름) */
  readonly icon: string;

  /** Agent 키워드 */
  readonly keywords: readonly string[];
}
