<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useSessionStore } from '@/stores/session'
import { uploadService } from '@/services/upload'
import { chatService } from '@/services/chat'
import { Plus, Folder, Edit, MoreFilled, Upload, CaretBottom, CaretRight, Promotion } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const sessionStore = useSessionStore()

const conversations = computed(() => sessionStore.sessions)
const currentSessionId = computed(() => sessionStore.currentSessionId)
const messages = computed(() => sessionStore.messages)

const isEditingTitle = ref(false)
const editingTitle = ref('')
const titleInputRef = ref<HTMLInputElement | null>(null)
const currentSessionTitle = ref('')
const inputMessage = ref('')
const loading = ref(false)
const localImageFiles = ref<File[]>([])
const uploadedImageUrls = ref<string[]>([])
const imageInputRef = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const sidebarOpen = ref(localStorage.getItem('sidebarOpen') !== 'false')
const messagesContainerRef = ref<HTMLElement | null>(null)
const expandedThinks = ref<Set<string>>(new Set())

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
const MAX_IMAGES = 5

onMounted(async () => {
  sessionStore.loadSessionsFromCache()
  await sessionStore.loadSessionList()

  // 如果有当前会话ID，恢复会话
  if (currentSessionId.value) {
    updateCurrentSessionTitle()
    await sessionStore.loadSessionHistory(currentSessionId.value)
    // 加载完成后滚动到底部
    await nextTick()
    scrollToBottom()
  }
})

function updateCurrentSessionTitle() {
  const session = conversations.value.find(s => s.session_id === currentSessionId.value)
  currentSessionTitle.value = session?.session_name || ''
}

async function loadSessionList() {
  await sessionStore.loadSessionList()
}

async function createNewSession() {
  // 只是重置状态，不立即创建会话
  // 实际创建会话延迟到发送消息时
  sessionStore.setCurrentSessionId(null)
  sessionStore.messages = []
  currentSessionTitle.value = ''
}

async function selectConversation(sessionId: string) {
  await sessionStore.selectSession(sessionId)
  updateCurrentSessionTitle()
  await nextTick()
  scrollToBottom()
}

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const files = Array.from(input.files)
  const invalidFiles = files.filter(f => !ALLOWED_TYPES.includes(f.type))
  if (invalidFiles.length > 0) {
    ElMessage.error('仅支持 png、jpg、jpeg 格式的图片')
    input.value = ''
    return
  }

  if (uploadedImageUrls.value.length + files.length > MAX_IMAGES) {
    ElMessage.error(`最多上传 ${MAX_IMAGES} 张图片`)
    input.value = ''
    return
  }

  // 立即上传图片
  isUploading.value = true
  try {
    const uploadResult = await uploadService.uploadRiskImages(files)
    if (uploadResult.success && uploadResult.data) {
      // 用服务器返回的URL显示预览
      uploadedImageUrls.value = [...uploadedImageUrls.value, ...uploadResult.data]
    } else {
      ElMessage.error(uploadResult.error || '图片上传失败')
    }
  } finally {
    isUploading.value = false
  }
  input.value = ''
}

function removeImage(index: number) {
  uploadedImageUrls.value = uploadedImageUrls.value.filter((_, i) => i !== index)
  localImageFiles.value = localImageFiles.value.filter((_, i) => i !== index)
}

async function sendMessage() {
  if (!inputMessage.value.trim() && uploadedImageUrls.value.length === 0) return
  if (loading.value) return

  loading.value = true
  const question = inputMessage.value.trim()

  // 图片已在handleImageUpload时上传，uploadedImageUrls包含服务器返回的URLs
  const uploadedUrls = [...uploadedImageUrls.value]

  // 确保有会话ID - 如果是新会话，截取问题前20字作为标题
  let sessionId = currentSessionId.value
  if (!sessionId) {
    const sessionTitle = question.length > 20 ? question.substring(0, 20) + '...' : question
    sessionId = await sessionStore.createSession(sessionTitle)
    if (sessionId) {
      updateCurrentSessionTitle()
    } else {
      ElMessage.error('创建会话失败')
      loading.value = false
      return
    }
  }

  // 添加用户消息
  sessionStore.addUserMessage(question, uploadedUrls)
  uploadedImageUrls.value = []
  localImageFiles.value = []
  inputMessage.value = ''

  await nextTick()
  scrollToBottom()

  try {
    // 创建AI消息占位
    sessionStore.addAssistantMessage()
    
    // 流式获取响应
    let thinkContent = ''
    let outputContent = ''

    for await (const msg of chatService.askStream(question, sessionId, uploadedUrls)) {
      if (msg.type === 'think') {
        thinkContent += msg.content
        sessionStore.updateLastAssistantMessage(thinkContent, undefined)
      } else if (msg.type === 'output') {
        outputContent += msg.content
      }
      await nextTick()
      scrollToBottom()
    }

    // 流结束后，解析output并更新
    if (outputContent) {
      try {
        const outputObj = JSON.parse(outputContent)
        // 检查是否是错误响应格式
        if (outputObj && outputObj.status_code !== undefined && outputObj.status_code !== 200) {
          sessionStore.updateLastAssistantMessage(thinkContent, undefined)
          ElMessage.error(outputObj.msg || '系统异常')
        } else if (outputObj && (outputObj.name || outputObj.risk_type || outputObj.description)) {
          // 有效的风险结果，保留think内容
          sessionStore.updateLastAssistantMessage(thinkContent, outputObj)
        } else {
          // JSON解析成功但不是风险结果格式，设置content为空
          sessionStore.updateLastAssistantMessage(thinkContent, undefined)
        }
      } catch {
        // JSON解析失败，可能是普通文本回复，不显示think，直接显示文本
        sessionStore.updateLastAssistantMessage('', { name: outputContent } as any)
      }
    }
    
    await loadSessionList()
  } catch {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

function scrollToBottom() {
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
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

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
  localStorage.setItem('sidebarOpen', String(sidebarOpen.value))
}

function editSessionTitle() {
  if (!currentSessionId.value) return
  editingTitle.value = currentSessionTitle.value || '新对话'
  isEditingTitle.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
  })
}

async function saveSessionTitle() {
  const title = editingTitle.value.trim()
  if (!title) {
    isEditingTitle.value = false
    return
  }
  
  if (currentSessionId.value) {
    await sessionStore.updateSessionTitle(currentSessionId.value, title)
    currentSessionTitle.value = title
  }
  
  isEditingTitle.value = false
  await loadSessionList()
}

function cancelEditTitle() {
  isEditingTitle.value = false
}

function toggleThink(messageId: string) {
  if (expandedThinks.value.has(messageId)) {
    expandedThinks.value.delete(messageId)
  } else {
    expandedThinks.value.add(messageId)
  }
}

function parseOutput(output: any): Record<string, string>[] {
  if (!output) return []
  
  // 如果output是字符串，尝试解析
  if (typeof output === 'string') {
    try {
      output = JSON.parse(output)
    } catch {
      return []
    }
  }
  
  // 返回单条记录
  if (output.name) {
    return [output]
  }
  
  return []
}

const riskLabels: Record<string, string> = {
  name: '风险名称',
  description: '风险描述',
  risk_type: '风险类型',
  risk_level: '风险等级',
  risk_status: '风险状态',
  according: '依据',
  solution: '解决方案',
  sources: '来源'
}
</script>

<template>
  <div class="chat-page">
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>

    <!-- 左侧边栏 -->
    <aside class="sidebar" :class="{ closed: !sidebarOpen }">
      <div class="sidebar-header">
        <div class="logo">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="white" fill-opacity="0.9" />
            <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="white" fill-opacity="0.5" />
          </svg>
          <span class="logo-text">安全专家</span>
        </div>
      </div>

      <div class="menu-item">
        <el-button class="menu-btn">
          <el-icon class="menu-icon"><Folder /></el-icon>
          <span>知识库管理</span>
        </el-button>
      </div>

      <div class="new-chat">
        <el-button type="primary" class="new-chat-btn" @click="createNewSession">
          <span class="plus-icon">+</span>
          新建对话
        </el-button>
      </div>

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

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            {{ authStore.userInfo?.user_name?.charAt(0) || authStore.userName?.charAt(0) || 'U' }}
          </div>
          <span class="username">{{ authStore.userInfo?.user_name || authStore.userName || '用户' }}</span>
        </div>
        <el-button class="logout-btn" @click="logout">退出</el-button>
      </div>
    </aside>

    <!-- 右侧主聊天区域 -->
    <main class="chat-main">
      <div class="chat-header">
        <div class="header-left">
          <el-button class="edit-title-btn" @click="toggleSidebar">
            <el-icon><MoreFilled /></el-icon>
          </el-button>
        </div>
        <div class="header-center">
          <div v-if="isEditingTitle" class="title-edit">
            <input
              ref="titleInputRef"
              v-model="editingTitle"
              class="title-input"
              @keydown.enter="saveSessionTitle"
              @keydown.esc="cancelEditTitle"
              @blur="saveSessionTitle"
            />
          </div>
          <span v-else class="chat-session-title" @click="currentSessionId && editSessionTitle()">
            {{ currentSessionTitle || '新对话' }}
          </span>
          <span class="chat-subtitle">安全专家智能对话</span>
        </div>
        <div class="header-right">
          <el-button v-if="currentSessionId" class="edit-title-btn" @click="editSessionTitle">
            <el-icon><Edit /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div ref="messagesContainerRef" class="messages-container">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">🔒</div>
          <div class="empty-text">欢迎使用安全专家智能问答系统</div>
          <div class="empty-hint">上传图片或输入问题开始分析</div>
        </div>

        <div v-for="msg in messages" :key="msg.id" :class="['message', msg.role]">
          <div class="message-avatar">
            <span v-if="msg.role === 'user'">U</span>
            <span v-else>AI</span>
          </div>
          
          <div class="message-bubble">
            <!-- 用户图片 -->
            <div v-if="msg.images && msg.images.length > 0" class="message-images">
              <el-image
                v-for="(img, idx) in msg.images"
                :key="idx"
                :src="img"
                class="message-image"
                :preview-src-list="msg.images"
                fit="cover"
              />
            </div>
            
            <!-- 用户消息内容 -->
            <div v-if="msg.role === 'user'" class="message-content">{{ msg.content }}</div>
            
            <!-- AI消息内容 -->
            <div v-else class="ai-content">
              <!-- Think部分 -->
              <div v-if="msg.think" class="think-section">
                <div class="think-header" @click="toggleThink(msg.id)">
                  <el-icon v-if="expandedThinks.has(msg.id)"><el-icon><CaretBottom/></el-icon></el-icon>
                  <el-icon v-else><el-icon><CaretRight/></el-icon></el-icon>
                  <span>思考过程</span>
                </div>
                <div v-show="expandedThinks.has(msg.id)" class="think-content">
                  {{ msg.think }}
                </div>
              </div>
              
              <!-- Output部分 - 风险结果表单 -->
              <div v-if="msg.output" class="output-section">
                <div v-if="msg.output.name && msg.output.risk_type" class="output-form">
                  <div class="output-header">风险分析结果</div>
                  <div v-for="(value, key) in msg.output" :key="key" class="form-row">
                    <div class="form-label">{{ riskLabels[key] || key }}</div>
                    <div class="form-value">
                      <template v-if="key === 'sources' && Array.isArray(value)">
                        <span v-for="(s, i) in value" :key="i" class="source-tag">{{ s }}</span>
                      </template>
                      <template v-else>{{ value }}</template>
                    </div>
                  </div>
                </div>
                <div v-else class="output-text">
                  {{ msg.output.name || msg.content }}
                </div>
              </div>
              
              <!-- 空内容时的加载状态 -->
              <div v-if="!msg.think && !msg.output && msg.role === 'assistant'" class="loading-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-container">
        <div class="image-preview-row">
          <el-button class="upload-btn" :disabled="isUploading" @click="imageInputRef?.click()">
            <el-icon><Upload /></el-icon>
            <span v-if="isUploading">上传中...</span>
          </el-button>
          <div v-for="(url, index) in uploadedImageUrls" :key="index" class="image-preview-item">
            <img :src="url" alt="预览图片" />
            <div class="image-remove" @click="removeImage(index)">×</div>
          </div>
        </div>

        <input
          ref="imageInputRef"
          type="file"
          accept=".png,.jpg,.jpeg"
          multiple
          style="display: none"
          @change="handleImageUpload"
        />

        <div class="input-row">
          <el-input
            v-model="inputMessage"
            type="textarea"
            placeholder="请输入您的问题..."
            :rows="3"
            :disabled="loading"
            :maxlength="500"
            show-word-limit
            class="message-input"
            @keydown="handleKeyDown"
          />
          <el-button 
            type="primary" 
            class="send-btn" 
            :disabled="loading || (!inputMessage.trim() && localImageFiles.length === 0)"
            @click="sendMessage"
          >
            <el-icon v-if="!loading"><Promotion /></el-icon>
            <span v-else class="loading-spinner"></span>
          </el-button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.chat-page {
  display: flex;
  min-height: 100vh;
  background: #f7f8fa;
}

/* 左侧边栏 */
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  color: white;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar.closed {
  transform: translateX(-100%);
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

.menu-item {
  padding: 0 20px;
  margin-top: 8px;
}

.menu-btn {
  width: 100%;
  height: 44px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 20px;
  transition: background 0.2s;
}

.menu-icon {
  font-size: 16px;
  margin-right: 10px;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.new-chat {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.new-chat-btn {
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0;
  transition: background 0.2s;
}

.new-chat-btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
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
  background: #f7f8fa;
  min-width: 0;
  min-height: 0;
  height: 100vh;
  padding-left: 280px;
  overflow: hidden;
}

.chat-header {
  flex-shrink: 0;
  height: 50px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e5e5;
  background: white;
  width: 100%;
}

.header-left, .header-right {
  flex: 1;
  display: flex;
  align-items: center;
}

.header-right {
  justify-content: flex-end;
}

.header-center {
  flex: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.edit-title-btn {
  width: 32px;
  height: 32px;
  background: transparent !important;
  border: none !important;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.edit-title-btn:hover {
  background: rgba(0, 0, 0, 0.05) !important;
}

.edit-title-btn .el-icon {
  font-size: 16px;
  color: #666;
}

.chat-session-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.chat-subtitle {
  font-size: 11px;
  color: #999;
}

.title-edit {
  display: flex;
  align-items: center;
}

.title-input {
  width: 120px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-align: center;
  border: none;
  background: transparent;
  outline: none;
}

/* 消息列表 */
.messages-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: #999;
}

/* 消息样式 */
.message {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  width: 100%;
  padding: 0 24px;
  box-sizing: border-box;
}

.message.user {
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message.assistant .message-avatar {
  background: #e8e8e8;
  color: #666;
}

.message-bubble {
  max-width: 75%;
  min-width: 100px;
}

.message-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.message-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-content {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* AI消息内容 */
.ai-content {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.think-section {
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.think-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
}

.think-header:hover {
  background: #f0f0f0;
}

.think-content {
  padding: 10px 14px;
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  white-space: pre-wrap;
}

.output-section {
  padding: 0;
}

.output-header {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.output-form {
  padding: 12px 14px;
}

.form-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.form-row:last-child {
  border-bottom: none;
}

.form-label {
  width: 90px;
  font-size: 13px;
  color: #999;
  flex-shrink: 0;
}

.form-value {
  flex: 1;
  font-size: 13px;
  color: #333;
}

.source-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #e8f4ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 4px;
  margin-bottom: 4px;
}

.loading-dots {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  background: #ccc;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* 输入区域 */
.input-container {
  padding: 16px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.image-preview-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.image-preview-item {
  position: relative;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 12px;
  line-height: 1;
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  width: 100%;
}

.message-input {
  flex: 1;
}

.message-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  resize: none;
  font-size: 14px;
}

.send-btn {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.upload-btn {
  width: 42px;
  height: 42px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.upload-btn:hover {
  border-color: #667eea;
}

/* 移动端遮罩层 */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar:not(.closed) {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
  }

  .chat-main {
    width: 100%;
  }

  .chat-header {
    padding: 0 16px;
  }

  .messages-container {
    padding: 16px;
  }

  .message {
    max-width: 100%;
  }

  .message-bubble {
    max-width: 85%;
  }

  .image-preview-row {
    width: 100%;
    overflow-x: auto;
  }

  .input-row {
    width: 100%;
  }

  .message-input {
    width: 100%;
  }

  .input-container {
    padding: 12px 16px 20px;
  }

  .message-image {
    width: 80px;
    height: 80px;
  }
}
</style>
