import { API_BASE_URL } from '../config/api'
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

// 风险结果（output类型）
export interface RiskResult {
  name: string
  description: string
  risk_type: string
  risk_level: string
  risk_status: string
  according: string
  solution: string
  sources: string[]
}

// 流式消息
export interface StreamMessage {
  type: 'think' | 'output'
  content: string
}

export const chatService = {
  async createSession(title?: string) {
    return request<{ session_id: string }>('/api/v1/session/create', {
      method: 'POST',
      body: JSON.stringify(title || '新会话'),
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
      body: sessionId,
      contentType: 'text/plain',
    })
  },

  async clearSessionHistory(sessionId: string) {
    return request<void>('/api/v1/session/clear_session_history', {
      method: 'DELETE',
      body: sessionId,
      contentType: 'text/plain',
    })
  },

  async updateSessionTitle(sessionId: string, title: string) {
    return request<void>('/api/v1/session/update', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, session_name: title }),
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

  // 流式问答 - JSON对象流格式
  async *askStream(question: string, sessionId?: string, imageUrls?: string[]): AsyncGenerator<StreamMessage> {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
      },
      body: JSON.stringify({
        question,
        session_id: sessionId,
        image_urls: imageUrls || [],
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    // 用于累积output类型的content
    let currentOutputContent = ''
    let currentThinkContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 按换行分割，每行是一个完整的JSON对象
      const lines = buffer.split('\n')

      // 保留最后一行（可能不完整）
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line)
          if (data.type === 'think') {
            currentThinkContent += data.content
          } else if (data.type === 'output') {
            currentOutputContent += data.content
          }
        } catch {
          // 忽略解析错误
        }
      }
    }

    // 流结束后，处理buffer中剩余的数据
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer.trim())
        if (data.type === 'think') {
          currentThinkContent += data.content
        } else if (data.type === 'output') {
          currentOutputContent += data.content
        }
      } catch {
        // 忽略解析错误
      }
    }

    // 流结束后，输出累积的内容
    if (currentThinkContent) {
      yield { type: 'think', content: currentThinkContent }
    }
    if (currentOutputContent) {
      yield { type: 'output', content: currentOutputContent }
    }
  },
}
