<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { chatService, type Session } from '@/services/chat'
import { Plus } from '@element-plus/icons-vue'

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
}

const router = useRouter()
const authStore = useAuthStore()

const conversations = ref<Session[]>([])
const currentSessionId = ref<string | null>(null)
const messages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const loading = ref(false)
const imageFiles = ref<File[]>([])
const imageInputRef = ref<HTMLInputElement | null>(null)

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
const MAX_IMAGES = 5

onMounted(async () => {
  await loadSessionList()
})

async function loadSessionList() {
  const result = await chatService.getSessionList()
  if (result.success && result.data) {
    const data = result.data as { sessions?: { session_id: string; session_name: string; user_id: string }[] }
    conversations.value = data.sessions || []
  }
}

async function createNewSession() {
  const result = await chatService.createSession()
  if (result.success && result.data) {
    const data = result.data as { session_id?: string }
    if (data.session_id) {
      currentSessionId.value = data.session_id
      messages.value = []
      await loadSessionList()
    }
  }
}

async function selectConversation(sessionId: string) {
  currentSessionId.value = sessionId

  const result = await chatService.getSessionHistory(sessionId)
  if (result.success && result.data) {
    const data = result.data as { messages?: ChatMessage[] }
    messages.value = data.messages || []
  }
}

function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const files = Array.from(input.files)
  const invalidFiles = files.filter(f => !ALLOWED_TYPES.includes(f.type))
  if (invalidFiles.length > 0) {
    ElMessage.error('仅支持 png、jpg、jpeg 格式的图片')
    input.value = ''
    return
  }

  if (imageFiles.value.length + files.length > MAX_IMAGES) {
    ElMessage.error(`最多上传 ${MAX_IMAGES} 张图片`)
    input.value = ''
    return
  }

  imageFiles.value = [...imageFiles.value, ...files]
  input.value = ''
}

function removeImage(index: number) {
  imageFiles.value = imageFiles.value.filter((_, i) => i !== index)
}

function getImageUrl(file: File): string {
  return URL.createObjectURL(file)
}

async function sendMessage() {
  if (!inputMessage.value.trim() || loading.value) return

  loading.value = true
  const question = inputMessage.value.trim()

  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: question,
  })

  inputMessage.value = ''

  try {
    const result = await chatService.ask(question, currentSessionId.value || undefined)

    if (result.success && result.data) {
      const data = result.data as { answer?: string; session_id?: string }
      if (data.session_id) {
        currentSessionId.value = data.session_id
      }

      messages.value.push({
        id: Date.now() + 1,
        role: 'assistant',
        content: data.answer || '',
      })

      await loadSessionList()
    } else {
      ElMessage.error(result.error || '发送失败')
    }
  } catch {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="chat-page">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <!-- Logo 区域 -->
      <div class="sidebar-header">
        <div class="logo">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="white" fill-opacity="0.9" />
            <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="white" fill-opacity="0.5" />
          </svg>
          <span class="logo-text">安全专家</span>
        </div>
      </div>

      <!-- 新建对话按钮 -->
      <div class="new-chat">
        <el-button type="primary" class="new-chat-btn" @click="createNewSession">
          <span class="plus-icon">+</span>
          新建对话
        </el-button>
      </div>

      <!-- 对话列表 -->
      <div class="conversation-list">
        <div
          v-for="conv in conversations"
          :key="conv.session_id"
          class="conversation-item"
          :class="{ active: currentSessionId === conv.session_id }"
          @click="selectConversation(conv.session_id)"
        >
          <span class="conversation-title">{{ conv.session_name || '未命名会话' }}</span>
        </div>
      </div>

      <!-- 用户信息区域 -->
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            {{ authStore.userInfo?.user_name?.charAt(0) || authStore.userName?.charAt(0) || 'U' }}
          </div>
          <span class="username">{{ authStore.userInfo?.user_name || authStore.userName || '用户' }}</span>
        </div>
        <el-button class="logout-btn" @click="logout">
          退出
        </el-button>
      </div>
    </aside>

    <!-- 右侧主聊天区域 -->
    <main class="chat-main">
      <!-- 消息列表 -->
      <div class="messages-container">
        <div v-if="messages.length === 0" class="empty-state">
          欢迎使用安全专家智能问答系统
        </div>
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['message', msg.role]"
        >
          <div class="message-avatar">
            <span v-if="msg.role === 'user'">U</span>
            <span v-else>AI</span>
          </div>
          <div class="message-content">
            {{ msg.content }}
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-container">
        <el-button class="upload-btn" @click="imageInputRef?.click()">
          <el-icon><Plus /></el-icon>
        </el-button>
        <input
          ref="imageInputRef"
          type="file"
          accept=".png,.jpg,.jpeg"
          multiple
          style="display: none"
          @change="handleImageUpload"
        />
        <el-input
          v-model="inputMessage"
          type="textarea"
          placeholder="请输入您的问题..."
          :rows="3"
          :disabled="loading"
          class="message-input"
          @keydown="handleKeyDown"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.chat-page {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%);
}

/* 左侧边栏 */
.sidebar {
  width: 280px;
  background: linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%);
  display: flex;
  flex-direction: column;
  color: white;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
}

.new-chat {
  padding: 16px 20px;
}

.new-chat-btn {
  width: 100%;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.plus-icon {
  font-size: 18px;
  font-weight: 600;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}

.conversation-item {
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.conversation-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.conversation-item.active {
  background: rgba(255, 255, 255, 0.15);
}

.conversation-title {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.username {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.logout-btn {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
}

.logout-btn:hover {
  background: rgba(102, 126, 234, 0.4);
  color: white;
}

/* 右侧主聊天区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.messages-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

.message {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message.assistant .message-avatar {
  background: rgba(255, 255, 255, 0.9);
  color: #1a1a2e;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message.assistant .message-content {
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a2e;
}

/* 输入区域 */
.input-container {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
  align-items: flex-end;
  justify-content: center;
  background: transparent;
}

.message-input {
  width: 800px;
  height: 120px;
}

.message-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  resize: none;
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a2e;
  height: 120px;
}

.upload-btn {
  width: 42px;
  height: 42px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn:hover {
  background: rgba(255, 255, 255, 1);
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    bottom: 0;
    z-index: 100;
    transition: left 0.3s;
  }

  .sidebar.open {
    left: 0;
  }

  .chat-main {
    width: 100%;
    background: linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%);
  }
}
</style>