<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref()
const loading = ref(false)

const formData = reactive({
  user_name: '',
  user_password: '',
  confirm_password: '',
  phone: '',
  email: '',
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
  user_password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
}

const handleRegister = async () => {
  try {
    await formRef.value.validate()
    loading.value = true

    const result = await authService.register({
      user_name: formData.user_name,
      user_password: formData.user_password,
      phone: formData.phone,
      email: formData.email,
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
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧图片区域 -->
      <div class="auth-image-section">
        <div class="auth-image-content">
          <h1>安全隐患识别</h1>
          <p>智能问答系统</p>
        </div>
      </div>

      <!-- 右侧表单区域 -->
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
            <el-form-item prop="user_name">
              <el-input
                v-model="formData.user_name"
                placeholder="请输入用户名 (2-20字符)"
                size="large"
                prefix-icon="User"
              />
            </el-form-item>

            <el-form-item prop="user_password">
              <el-input
                v-model="formData.user_password"
                type="password"
                placeholder="请输入密码 (6-20字符)"
                size="large"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <el-form-item prop="confirm_password">
              <el-input
                v-model="formData.confirm_password"
                type="password"
                placeholder="请再次输入密码"
                size="large"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <el-form-item prop="phone">
              <el-input
                v-model="formData.phone"
                placeholder="请输入手机号"
                size="large"
                prefix-icon="Phone"
              />
            </el-form-item>

            <el-form-item prop="email">
              <el-input
                v-model="formData.email"
                placeholder="请输入邮箱"
                size="large"
                prefix-icon="Message"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                class="submit-btn"
                native-type="submit"
              >
                注册
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-container {
  display: flex;
  min-height: 100vh;
}

.auth-image-section {
  flex: 1;
  display: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  justify-content: center;
  align-items: center;
}

.auth-image-content {
  text-align: center;
  color: white;
}

.auth-image-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.auth-image-content p {
  font-size: 1.5rem;
  opacity: 0.9;
}

.auth-form-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: white;
}

.auth-form-wrapper {
  width: 100%;
  max-width: 400px;
}

.form-title {
  font-size: 1.75rem;
  color: #333;
  text-align: center;
  margin-bottom: 2rem;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.auth-form :deep(.el-form-item) {
  margin-bottom: 1.25rem;
}

.auth-form :deep(.el-input__wrapper) {
  padding: 12px 16px;
}

.submit-btn {
  width: 100%;
}

.form-footer {
  text-align: center;
  color: #666;
}

.form-footer span {
  margin-right: 0.5rem;
}

/* PC端 */
@media (min-width: 1024px) {
  .auth-image-section {
    display: flex;
  }

  .auth-form-section {
    max-width: 50%;
  }
}
</style>
