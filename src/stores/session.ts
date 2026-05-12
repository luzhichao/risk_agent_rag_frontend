import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { chatService, type RiskResult, type Session as ChatSession } from '@/services/chat'

const SESSIONS_KEY = 'chat_sessions'
const CURRENT_SESSION_KEY = 'current_session_id'

// 扩展的消息类型，包含图片和output
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  think?: string
  output?: RiskResult
  timestamp: number
}

// 会话类型
export interface Session {
  session_id: string
  session_name: string
  user_id: string
}

export const useSessionStore = defineStore('session', () => {
  // 会话列表
  const sessions = ref<Session[]>([])
  
  // 当前会话ID
  const currentSessionId = ref<string | null>(localStorage.getItem(CURRENT_SESSION_KEY))
  
  // 当前会话消息
  const messages = ref<ChatMessage[]>([])
  
  // 加载状态
  const loading = ref(false)

  // 计算属性
  const currentSession = computed(() => {
    return sessions.value.find(s => s.session_id === currentSessionId.value)
  })

  // 从localStorage恢复会话列表
  function loadSessionsFromCache() {
    try {
      const cached = localStorage.getItem(SESSIONS_KEY)
      if (cached) {
        sessions.value = JSON.parse(cached)
      }
    } catch {
      sessions.value = []
    }
  }

  // 保存会话列表到localStorage
  function saveSessionsToCache() {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.value))
  }

  // 设置当前会话ID
  function setCurrentSessionId(id: string | null) {
    currentSessionId.value = id
    if (id) {
      localStorage.setItem(CURRENT_SESSION_KEY, id)
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY)
    }
  }

  // 加载会话列表
  async function loadSessionList() {
    loading.value = true
    try {
      const result = await chatService.getSessionList()
      if (result.success && result.data) {
        // API返回的data直接是会话数组，不是{ sessions: [...] }对象
        const data = result.data as unknown as ChatSession[]
        sessions.value = (data || []) as Session[]
        saveSessionsToCache()
      }
    } finally {
      loading.value = false
    }
  }

  // 创建新会话
  async function createSession(title?: string) {
    const result = await chatService.createSession(title)
    if (result.success && result.data) {
      // API返回的data直接是session_id字符串，不是{ session_id: string }对象
      const sessionId = result.data as unknown as string
      if (sessionId) {
        setCurrentSessionId(sessionId)
        messages.value = []
        await loadSessionList()
        return sessionId
      }
    }
    return null
  }

  // 选择会话
  async function selectSession(sessionId: string) {
    setCurrentSessionId(sessionId)
    await loadSessionHistory(sessionId)
  }

  // 加载会话历史 - 转换API返回的消息格式
  async function loadSessionHistory(sessionId: string) {
    loading.value = true
    try {
      const result = await chatService.getSessionHistory(sessionId)
      if (result.success && result.data) {
        // API返回的data直接是消息数组: [{type: "human"|"ai", content: string|[{type:"text",text:"..."}]}]
        const rawMessages = result.data as unknown as Array<{ type: string; content: string | Array<{ type: string; text: string }> }>

        messages.value = (rawMessages || []).map((msg, idx) => {
          // 转换type到role: human -> user, ai -> assistant
          const role = msg.type === 'human' ? 'user' : 'assistant'

          // 处理content格式：可能是字符串，也可能是[{type:"text",text:"..."}]数组
          let text = ''
          let output: RiskResult | undefined

          if (typeof msg.content === 'string') {
            text = msg.content
            // 如果是AI消息且content是JSON格式，解析为output
            if (role === 'assistant') {
              try {
                const parsed = JSON.parse(text) as RiskResult
                if (parsed && (parsed.name || parsed.risk_type || parsed.description)) {
                  output = parsed
                  text = parsed.name || parsed.description || ''
                }
              } catch {
                // JSON解析失败，将普通文本作为output.name显示，不显示think
                output = { name: text, description: '', risk_type: '', risk_level: '', risk_status: '', according: '', solution: '', sources: [] }
                text = ''
              }
            }
          } else if (Array.isArray(msg.content)) {
            text = msg.content.map((c: { text?: string }) => c.text || '').join('')
          }

          return {
            id: `history_${idx}`,
            role: role as 'user' | 'assistant',
            content: text,
            output,
            timestamp: Date.now(),
          }
        })
      }
    } finally {
      loading.value = false
    }
  }

  // 清空会话历史
  async function clearSessionHistory(sessionId: string) {
    const result = await chatService.clearSessionHistory(sessionId)
    if (result.success) {
      messages.value = []
    }
  }

  // 更新会话标题
  async function updateSessionTitle(sessionId: string, title: string) {
    const result = await chatService.updateSessionTitle(sessionId, title)
    if (result.success) {
      const index = sessions.value.findIndex(s => s.session_id === sessionId)
      if (index !== -1) {
        const session = sessions.value[index]!
        sessions.value[index] = {
          session_id: session.session_id,
          session_name: title,
          user_id: session.user_id,
        }
        saveSessionsToCache()
      }
    }
  }

  // 添加用户消息
  function addUserMessage(content: string, images?: string[]) {
    messages.value.push({
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      images,
      timestamp: Date.now(),
    })
  }

  // 添加AI消息
  function addAssistantMessage(think?: string, output?: RiskResult) {
    messages.value.push({
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: '',
      think,
      output,
      timestamp: Date.now(),
    })
  }

  // 更新最后一条AI消息
  function updateLastAssistantMessage(think?: string, output?: RiskResult) {
    const lastMsg = messages.value[messages.value.length - 1]
    if (lastMsg && lastMsg.role === 'assistant') {
      if (think !== undefined) {
        lastMsg.think = think
      }
      if (output !== undefined) {
        lastMsg.output = output
        // 如果output.name是普通文本（非JSON风险结果），直接使用name作为content
        if (output.name && !output.risk_type) {
          lastMsg.content = output.name
        } else {
          lastMsg.content = output ? JSON.stringify(output) : ''
        }
      }
    }
  }

  return {
    sessions,
    currentSessionId,
    messages,
    loading,
    currentSession,
    loadSessionsFromCache,
    saveSessionsToCache,
    setCurrentSessionId,
    loadSessionList,
    createSession,
    selectSession,
    loadSessionHistory,
    clearSessionHistory,
    updateSessionTitle,
    addUserMessage,
    addAssistantMessage,
    updateLastAssistantMessage,
  }
})
