export const GuiAgentCategories = [
  'general',
  'research',
  'development',
  'creative',
  'analytics',
  'customer_support',
] as const;

export type GuiAgentCategory = (typeof GuiAgentCategories)[number];

export const GuiCategoryKeywordsMap: Record<GuiAgentCategory, string[]> = {
  general: ['general', 'assistant', 'help', 'versatile'],
  research: ['research', 'search', 'academic', 'papers', 'fact-checking', 'analysis'],
  development: ['coding', 'programming', 'developer', 'git', 'debug', 'software'],
  creative: ['creative', 'writing', 'design', 'art', 'content', 'copywriting'],
  analytics: ['analytics', 'data', 'analysis', 'visualization', 'insights', 'reports'],
  customer_support: ['support', 'customer', 'service', 'help', 'faq', 'engagement'],
};
