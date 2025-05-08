
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  attachments?: Array<{
    type: string;
    name: string;
    content?: string;
    url?: string;
  }>;
}

export interface UserSession {
  id: string;
  nickname: string | null;
}
