<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View, Hide } from '@element-plus/icons-vue'
import { authService } from '@/services/auth'
import AnimatedCharacters from '@/components/AnimatedCharacters/index.vue'

const router = useRouter()

const formRef = ref()
const loading = ref(false)
const isTyping = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordValue = ref('')
const confirmPasswordValue = ref('')

const formData = reactive({
  user_name: '',
  email: '',
  phone: '',
  user_password: '',
  confirm_password: '',
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== formData.user_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  user_name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  user_password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const handleRegister = async () => {
  try {
    await formRef.value.validate()
    loading.value = true

    const result = await authService.register({
      user_name: formData.user_name,
      email: formData.email,
      phone: formData.phone,
      user_password: formData.user_password,
    })

    if (result.success) {
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } else {
      ElMessage.error(result.error || '注册失败')
    }
  } catch {
    // 表单验证失败
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
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
            :show-confirm-password="showConfirmPassword"
            :confirm-password-length="confirmPasswordValue.length"
          />
        </div>
      </div>

      <!-- 右侧表单区域 - 50% -->
      <div class="auth-form-section">
        <div class="auth-form-wrapper">
          <h2 class="form-title">欢迎注册</h2>

          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            class="auth-form"
            @submit.prevent="handleRegister"
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

            <div class="field-label">邮箱</div>
            <el-form-item prop="email">
              <el-input
                v-model="formData.email"
                placeholder="请输入邮箱"
                size="large"
              />
            </el-form-item>

            <div class="field-label">手机号</div>
            <el-form-item prop="phone">
              <el-input
                v-model="formData.phone"
                placeholder="请输入手机号"
                size="large"
              />
            </el-form-item>

            <div class="field-label">密码</div>
            <el-form-item prop="user_password">
              <el-input
                ref="passwordInputRef"
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

            <div class="field-label">确认密码</div>
            <el-form-item prop="confirm_password">
              <el-input
                ref="confirmPasswordInputRef"
                v-model="formData.confirm_password"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="请再次输入密码"
                size="large"
                @input="confirmPasswordValue = formData.confirm_password"
              >
                <template #suffix>
                  <el-icon class="eye-toggle" @click="toggleConfirmPasswordVisibility">
                    <View v-if="showConfirmPassword" />
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
                {{ loading ? '正在注册...' : '注册' }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="form-footer">
            <span>已有账号？</span>
            <el-button type="primary" link @click="goToLogin">立即登录</el-button>
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
  margin-bottom: 1.5rem;
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
  margin-bottom: 1rem;
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
    padding: 24px 20px;
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