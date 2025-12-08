export interface User {
  id: number;
  username: string;
  email?: string;
  is_staff: boolean;
  password?: string; // Only for sending updates
}

export interface LLM {
  id: number;
  name: string;
  openai_link?: string;
  api_token?: string;
}

export interface LLMResult {
  id: number;
  llm: number;
  result: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'all';
  created_at?: string;
}

export interface UnitTest {
  id: number;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'all';
  prompt: string;
  tests: string;
}

export interface LLMUser {
  id: number;
  llm: number;
  user: number;
  token: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface DecodedToken {
  user_id: number;
  exp: number;
  // Standard JWT claims
}