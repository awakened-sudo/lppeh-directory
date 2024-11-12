export type ChatCompletionRole = 'system' | 'user' | 'assistant' | 'tool' | 'function';

export interface ChatMessage {
  role: ChatCompletionRole;
  content: string;
} 