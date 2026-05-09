<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View, Hide } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth'
import AnimatedCharacters from '@/components/AnimatedCharacters/index.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)
const isTyping = ref(false)
const showPassword = ref(false)
const passwordValue = ref('')

const formData = reactive({
  user_name: '',
  user_password: '',
})

const rules = {
  user_name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  user_password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  try {
    await formRef.value.validate()
    loading.value = true

    const result = await authService.login(formData)
    console.log('login result:', result)

    if (result.success && result.data !== undefined) {
      let token = ''
      if (typeof result.data === 'string') {
        token = result.data
      } else if (typeof result.data === 'object' && result.data !== null) {
        token = (result.data as { token?: string })?.token || ''
      }

      console.log('extracted token:', token ? 'valid' : 'empty')
      console.log('token length:', token.length)

      if (!token) {
        ElMessage.error('登录失败：未获取到 token')
        loading.value = false
        return
      }

      authStore.setToken(token, formData.user_name)
      console.log('token saved, isLoggedIn:', authStore.isLoggedIn)

      // 获取用户信息
      const userInfoResult = await authService.getUserInfo()
      console.log('getUserInfo result:', userInfoResult)
      if (userInfoResult.success && userInfoResult.data) {
        authStore.setUserInfo(userInfoResult.data as any)
      }

      ElMessage.success('登录成功')
      const redirect = route.query.redirect as string
      console.log('redirecting to:', redirect || '/chat')
      router.push(redirect || '/chat')
    } else {
      ElMessage.error(result.error || '登录失败')
    }
  } catch {
    // 表单验证失败
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧动画区域 - 50% -->
      <div class="auth-animation-section">
        <!-- 背景渐变 -->
        <div class="bg-gradient"></div>

        <!-- 装饰网格 -->
        <div class="decor-grid"></div>

        <!-- 品牌标识 -->
        <div class="left-top">
          <div class="brand-mark">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="white" fill-opacity="0.9" />
              <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="white" fill-opacity="0.5" />
            </svg>
          </div>
          <span class="brand-name">安全专家智能问答系统</span>
        </div>

        <!-- 动画角色区域 -->
        <div class="characters-area">
          <AnimatedCharacters
            :is-typing="isTyping"
            :show-password="showPassword"
            :password-length="passwordValue.length"
          />
        </div>
      </div>

      <!-- 右侧表单区域 - 50% -->
      <div class="auth-form-section">
        <div class="auth-form-wrapper">
          <h2 class="form-title">欢迎登录</h2>

          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            class="auth-form"
            @submit.prevent="handleLogin"
          >
            <div class="field-label">用户名</div>
            <el-form-item prop="user_name">
              <el-input
                v-model="formData.user_name"
                placeholder="请输入用户名"
                size="large"
                @focus="isTyping = true"
                @blur="isTyping = false"
              />
            </el-form-item>

            <div class="field-label">密码</div>
            <el-form-item prop="user_password">
              <el-input
                v-model="formData.user_password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                size="large"
                @input="passwordValue = formData.user_password"
              >
                <template #suffix>
                  <el-icon class="eye-toggle" @click="togglePasswordVisibility">
                    <View v-if="showPassword" />
                    <Hide v-else />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                class="submit-btn"
                native-type="submit"
              >
                {{ loading ? '正在登录...' : '登录' }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="form-footer">
            <span>还没有账号？</span>
            <el-button type="primary" link @click="goToRegister">立即注册</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: #0f0f23;
}

.auth-container {
  display: flex;
  min-height: 100vh;
}

/* 左侧动画区域 - 50% */
.auth-animation-section {
  flex: 0 0 50%;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 32px 48px;
  background: linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%);
  overflow: hidden;
  min-height: 100vh;
}

.bg-gradient {
  position: absolute;
  inset: 0;
}

.decor-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 1;
}

/* 品牌标识 */
.left-top {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.brand-name {
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 动画角色区域 */
.characters-area {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex: 1;
  height: 400px;
}

/* 装饰模糊 */
.decor-blur-1 {
  position: absolute;
  top: 15%;
  right: 10%;
  width: 300px;
  height: 300px;
  background: rgba(59, 130, 246, 0.25);
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

.decor-blur-2 {
  position: absolute;
  bottom: 10%;
  left: 5%;
  width: 400px;
  height: 400px;
  background: rgba(30, 64, 175, 0.3);
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  z-index: 0;
}

/* 右侧表单区域 - 50% */
.auth-form-section {
  flex: 0 0 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  min-height: 100vh;
}

.auth-form-wrapper {
  width: 100%;
  max-width: 400px;
  padding: 40px;
}

.form-title {
  font-size: 1.75rem;
  color: #1a1a2e;
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 600;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
  letter-spacing: 0.2px;
}

.auth-form :deep(.el-form-item) {
  margin-bottom: 1.25rem;
}

.auth-form :deep(.el-input__wrapper) {
  padding: 10px 14px;
}

.eye-toggle {
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.eye-toggle:hover {
  color: #374151;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
}

.form-footer {
  text-align: center;
  color: #666;
}

.form-footer span {
  margin-right: 0.5rem;
}

/* 移动端 - 全屏表单 */
@media (max-width: 1023px) {
  .auth-animation-section {
    display: none;
  }

  .auth-form-section {
    flex: 1;
    max-width: 100%;
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    padding: 20px;
  }

  .auth-form-wrapper {
    background: white;
    border-radius: 16px;
    padding: 30px 24px;
    max-width: 100%;
    width: 100%;
  }

  .form-title {
    color: #1a1a2e;
  }

  .submit-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
}
</style>