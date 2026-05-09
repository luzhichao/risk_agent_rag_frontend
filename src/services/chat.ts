import { request } from './request'

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export interface Session {
  session_id: string
  session_name: string
  user_id: string
}

export const chatService = {
  async createSession(title?: string) {
    return request<{ session_id: string }>('/api/v1/session/create', {
      method: 'POST',
      body: title ? JSON.stringify(title) : JSON.stringify(''),
    })
  },

  async getSessionList() {
    return request<{ sessions: Session[] }>('/api/v1/session/list_user_sessions', {
      method: 'POST',
    })
  },

  async getSessionHistory(sessionId: string) {
    return request<{ session_id: string; messages: ChatMessage[] }>('/api/v1/session/session_history', {
      method: 'POST',
      body: JSON.stringify(sessionId),
    })
  },

  async clearSessionHistory(sessionId: string) {
    return request<void>('/api/v1/session/clear_session_history', {
      method: 'DELETE',
      body: JSON.stringify(sessionId),
    })
  },

  async ask(question: string, sessionId?: string, imageUrls?: string[]) {
    return request<{ answer: string; session_id: string }>('/api/v1/chat/ask', {
      method: 'POST',
      body: JSON.stringify({
        question,
        session_id: sessionId,
        image_urls: imageUrls || [],
      }),
    })
  },
}