<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)

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

    if (result.success && result.data) {
      const token = result.data as string
      authStore.setToken(token, formData.user_name)
      ElMessage.success('登录成功')
      const redirect = route.query.redirect as string
      router.push(redirect || '/')
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
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧几何角色动画区域 -->
      <div class="auth-animation-section">
        <div class="characters">
          <!-- 紫色长方形角色 -->
          <div class="character purple-rect">
            <div class="safety-helmet">👷</div>
            <div class="body"></div>
          </div>
          
          <!-- 黑色长方形角色 -->
          <div class="character black-rect">
            <div class="safety-helmet">👷</div>
            <div class="body"></div>
          </div>
          
          <!-- 橙色半圆角色 -->
          <div class="character orange-semi">
            <div class="safety-helmet">👷</div>
            <div class="body"></div>
          </div>
          
          <!-- 黄色圆角矩形角色 -->
          <div class="character yellow-rounded">
            <div class="safety-helmet">👷</div>
            <div class="body"></div>
          </div>
        </div>
      </div>

      <!-- 右侧表单区域 -->
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
            <el-form-item prop="user_name">
              <el-input
                v-model="formData.user_name"
                placeholder="请输入用户名"
                size="large"
                prefix-icon="User"
              />
            </el-form-item>

            <el-form-item prop="user_password">
              <el-input
                v-model="formData.user_password"
                type="password"
                placeholder="请输入密码"
                size="large"
                prefix-icon="Lock"
                show-password
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
  background: #f5f5f5;
}

.auth-container {
  display: flex;
  min-height: 100vh;
}

/* 左侧动画区域 - 50% */
.auth-animation-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e0e0e0 0%, #b0b0b0 50%, #808080 100%);
  position: relative;
  overflow: hidden;
}

.characters {
  display: flex;
  gap: 40px;
  align-items: flex-end;
  padding: 40px;
}

/* 角色基础样式 */
.character {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: float 3s ease-in-out infinite;
}

.character:nth-child(1) { animation-delay: 0s; }
.character:nth-child(2) { animation-delay: 0.5s; }
.character:nth-child(3) { animation-delay: 1s; }
.character:nth-child(4) { animation-delay: 1.5s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.safety-helmet {
  font-size: 40px;
  z-index: 1;
  position: relative;
}

.body {
  margin-top: -10px;
}

/* 紫色长方形 */
.purple-rect .body {
  width: 80px;
  height: 120px;
  background: linear-gradient(180deg, #9b59b6 0%, #8e44ad 100%);
  border-radius: 10px;
}

/* 黑色长方形 */
.black-rect .body {
  width: 70px;
  height: 140px;
  background: linear-gradient(180deg, #2c3e50 0%, #1a252f 100%);
  border-radius: 8px;
}

/* 橙色半圆 */
.orange-semi .body {
  width: 90px;
  height: 80px;
  background: linear-gradient(180deg, #e67e22 0%, #d35400 100%);
  border-radius: 90px 90px 20px 20px;
}

/* 黄色圆角矩形 */
.yellow-rounded .body {
  width: 75px;
  height: 100px;
  background: linear-gradient(180deg, #f1c40f 0%, #f39c12 100%);
  border-radius: 20px;
}

/* 右侧表单区域 - 50% */
.auth-form-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
}

.auth-form-wrapper {
  width: 100%;
  max-width: 360px;
  padding: 20px;
}

.form-title {
  font-size: 1.75rem;
  color: #333;
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 600;
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
  height: 44px;
  font-size: 16px;
}

.form-footer {
  text-align: center;
  color: #666;
}

.form-footer span {
  margin-right: 0.5rem;
}

/* PC端 - 左右50%布局 */
@media (min-width: 1024px) {
  .auth-form-section {
    max-width: 50%;
  }
}

/* 移动端 - 上下50%布局 */
@media (max-width: 1023px) {
  .auth-container {
    flex-direction: column;
  }

  .auth-animation-section {
    flex: 1;
    min-height: 45vh;
    max-height: 55vh;
  }

  .auth-form-section {
    flex: 1;
    min-height: 45vh;
    max-height: 55vh;
    max-width: 100%;
  }

  .characters {
    gap: 20px;
    padding: 20px;
  }

  .safety-helmet {
    font-size: 28px;
  }

  .purple-rect .body { width: 50px; height: 75px; }
  .black-rect .body { width: 45px; height: 85px; }
  .orange-semi .body { width: 55px; height: 50px; }
  .yellow-rounded .body { width: 48px; height: 65px; }
}
</style>
