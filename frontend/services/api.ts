import { API_URL } from '../constants';

const getHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  login: async (data: any) => {
    const response = await fetch(`${API_URL}/api/auth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Ошибка входа');
    return response.json();
  },

  // Generic fetcher
  request: async (endpoint: string, method: string = 'GET', data?: any, token?: string) => {
    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method,
      headers: getHeaders(token),
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (response.status === 204) return null;
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${errorText}`);
    }
    return response.json();
  },
};