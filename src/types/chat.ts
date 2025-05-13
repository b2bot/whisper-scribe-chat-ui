
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

export interface UserSession {
  id: string;
  nickname: string | null;
}
