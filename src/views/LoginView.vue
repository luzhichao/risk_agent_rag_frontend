<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)
const passwordInputRef = ref<HTMLElement | null>(null)
const isPasswordFocused = ref(false)

const mousePos = reactive({ x: 0, y: 0 })
const isMouseInAnimationArea = ref(false)

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

const handleMouseMove = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  mousePos.x = e.clientX - rect.left
  mousePos.y = e.clientY - rect.top
}

const handleMouseEnter = () => {
  isMouseInAnimationArea.value = true
}

const handleMouseLeave = () => {
  isMouseInAnimationArea.value = false
  mousePos.x = 0
  mousePos.y = 0
}

const handlePasswordFocus = () => {
  isPasswordFocused.value = true
}

const handlePasswordBlur = () => {
  isPasswordFocused.value = false
}

onMounted(() => {
  if (passwordInputRef.value) {
    const el = passwordInputRef.value.querySelector('input') || passwordInputRef.value
    el.addEventListener('focus', handlePasswordFocus)
    el.addEventListener('blur', handlePasswordBlur)
  }
})
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧动画区域 - 2/3 -->
      <div 
        class="auth-animation-section"
        @mousemove="handleMouseMove"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <div class="animation-content">
          <!-- 卡通小动物们 -->
          <div class="animals">
            <!-- 小猫 -->
            <div class="animal cat" :style="{ transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)` }">
              <div class="animal-body">
                <div class="helmet">👷</div>
                <div class="face">
                  <div class="eyes" :class="{ covered: isPasswordFocused, 'following': !isPasswordFocused && isMouseInAnimationArea }">
                    <div class="eye left" :style="{ transform: `translate(${isMouseInAnimationArea ? mousePos.x * 0.03 : 0}px, ${isMouseInAnimationArea ? mousePos.y * 0.03 : 0}px)` }">
                      <div class="pupil"></div>
                    </div>
                    <div class="eye right" :style="{ transform: `translate(${isMouseInAnimationArea ? mousePos.x * 0.03 : 0}px, ${isMouseInAnimationArea ? mousePos.y * 0.03 : 0}px)` }">
                      <div class="pupil"></div>
                    </div>
                    <div v-if="isPasswordFocused" class="hands">
                      <div class="hand left"></div>
                      <div class="hand right"></div>
                    </div>
                  </div>
                  <div class="nose"></div>
                  <div class="mouth"></div>
                </div>
              </div>
            </div>

            <!-- 小狗 -->
            <div class="animal dog" :style="{ transform: `translate(${mousePos.x * 0.03}px, ${mousePos.y * 0.015}px)` }">
              <div class="animal-body">
                <div class="helmet">👷</div>
                <div class="face">
                  <div class="eyes" :class="{ covered: isPasswordFocused, 'following': !isPasswordFocused && isMouseInAnimationArea }">
                    <div class="eye left" :style="{ transform: `translate(${isMouseInAnimationArea ? mousePos.x * 0.04 : 0}px, ${isMouseInAnimationArea ? mousePos.y * 0.04 : 0}px)` }">
                      <div class="pupil"></div>
                    </div>
                    <div class="eye right" :style="{ transform: `translate(${isMouseInAnimationArea ? mousePos.x * 0.04 : 0}px, ${isMouseInAnimationArea ? mousePos.y * 0.04 : 0}px)` }">
                      <div class="pupil"></div>
                    </div>
                    <div v-if="isPasswordFocused" class="hands">
                      <div class="hand left"></div>
                      <div class="hand right"></div>
                    </div>
                  </div>
                  <div class="nose"></div>
                  <div class="mouth"></div>
                </div>
              </div>
            </div>

            <!-- 小熊 -->
            <div class="animal bear" :style="{ transform: `translate(${mousePos.x * 0.025}px, ${mousePos.y * 0.025}px)` }">
              <div class="animal-body">
                <div class="helmet">👷</div>
                <div class="face">
                  <div class="eyes" :class="{ covered: isPasswordFocused, 'following': !isPasswordFocused && isMouseInAnimationArea }">
                    <div class="eye left" :style="{ transform: `translate(${isMouseInAnimationArea ? mousePos.x * 0.035 : 0}px, ${isMouseInAnimationArea ? mousePos.y * 0.035 : 0}px)` }">
                      <div class="pupil"></div>
                    </div>
                    <div class="eye right" :style="{ transform: `translate(${isMouseInAnimationArea ? mousePos.x * 0.035 : 0}px, ${isMouseInAnimationArea ? mousePos.y * 0.035 : 0}px)` }">
                      <div class="pupil"></div>
                    </div>
                    <div v-if="isPasswordFocused" class="hands">
                      <div class="hand left"></div>
                      <div class="hand right"></div>
                    </div>
                  </div>
                  <div class="nose"></div>
                  <div class="mouth"></div>
                </div>
              </div>
            </div>

            <!-- 小兔 -->
            <div class="animal rabbit" :style="{ transform: `translate(${mousePos.x * 0.035}px, ${mousePos.y * 0.01}px)` }">
              <div class="animal-body">
                <div class="helmet">👷</div>
                <div class="face">
                  <div class="eyes" :class="{ covered: isPasswordFocused, 'following': !isPasswordFocused && isMouseInAnimationArea }">
                    <div class="eye left" :style="{ transform: `translate(${isMouseInAnimationArea ? mousePos.x * 0.045 : 0}px, ${isMouseInAnimationArea ? mousePos.y * 0.045 : 0}px)` }">
                      <div class="pupil"></div>
                    </div>
                    <div class="eye right" :style="{ transform: `translate(${isMouseInAnimationArea ? mousePos.x * 0.045 : 0}px, ${isMouseInAnimationArea ? mousePos.y * 0.045 : 0}px)` }">
                      <div class="pupil"></div>
                    </div>
                    <div v-if="isPasswordFocused" class="hands">
                      <div class="hand left"></div>
                      <div class="hand right"></div>
                    </div>
                  </div>
                  <div class="nose"></div>
                  <div class="mouth"></div>
                </div>
              </div>
            </div>

            <!-- 小猪 -->
            <div class="animal pig" :style="{ transform: `translate(${mousePos.x * 0.015}px, ${mousePos.y * 0.03}px)` }">
              <div class="animal-body">
                <div class="helmet">👷</div>
                <div class="face">
                  <div class="eyes" :class="{ covered: isPasswordFocused, 'following': !isPasswordFocused && isMouseInAnimationArea }">
                    <div class="eye left" :style="{ transform: `translate(${isMouseInAnimationArea ? mousePos.x * 0.025 : 0}px, ${isMouseInAnimationArea ? mousePos.y * 0.025 : 0}px)` }">
                      <div class="pupil"></div>
                    </div>
                    <div class="eye right" :style="{ transform: `translate(${isMouseInAnimationArea ? mousePos.x * 0.025 : 0}px, ${isMouseInAnimationArea ? mousePos.y * 0.025 : 0}px)` }">
                      <div class="pupil"></div>
                    </div>
                    <div v-if="isPasswordFocused" class="hands">
                      <div class="hand left"></div>
                      <div class="hand right"></div>
                    </div>
                  </div>
                  <div class="nose"></div>
                  <div class="mouth"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 文字提示 -->
          <div class="animation-tip">
            <template v-if="isPasswordFocused">
              🔒 正在输入密码，小动物们捂住了眼睛~
            </template>
            <template v-else-if="isMouseInAnimationArea">
              👀 鼠标移动，小动物们的眼睛会跟随哦~
            </template>
            <template v-else>
              🐾 安全专家智能问答系统
            </template>
          </div>
        </div>
      </div>

      <!-- 右侧表单区域 - 1/3 -->
      <div class="auth-form-section" ref="passwordInputRef">
        <div class="auth-form-wrapper">
          <h2 class="form-title">欢迎登录</h2>
          
          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            class="auth-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="user_name" label="用户名">
              <el-input
                v-model="formData.user_name"
                placeholder="请输入用户名"
                size="large"
              >
                <template #prefix>
                  <span class="input-label">用户名</span>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="user_password" label="密码">
              <el-input
                v-model="formData.user_password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
              >
                <template #prefix>
                  <span class="input-label">密码</span>
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
                登录
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-container {
  display: flex;
  min-height: 100vh;
}

/* 左侧动画区域 - 2/3 */
.auth-animation-section {
  flex: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  position: relative;
  overflow: hidden;
}

.animation-content {
  text-align: center;
  position: relative;
  z-index: 1;
}

.animals {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
  padding: 20px;
}

.animal {
  transition: transform 0.1s ease-out;
}

.animal-body {
  width: 80px;
  height: 100px;
  background: linear-gradient(180deg, #FFE4B5 0%, #FFDAB9 100%);
  border-radius: 40px 40px 30px 30px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
}

.cat .animal-body {
  background: linear-gradient(180deg, #B0C4DE 0%, #87CEEB 100%);
}

.dog .animal-body {
  background: linear-gradient(180deg, #DEB887 0%, #D2691E 100%);
}

.bear .animal-body {
  background: linear-gradient(180deg, #8B4513 0%, #A0522D 100%);
}

.rabbit .animal-body {
  background: linear-gradient(180deg, #FFB6C1 0%, #FFC0CB 100%);
}

.pig .animal-body {
  background: linear-gradient(180deg, #FFB6C1 0%, #FF69B4 100%);
}

.helmet {
  font-size: 24px;
  position: absolute;
  top: -15px;
}

.face {
  margin-top: 20px;
  position: relative;
}

.eyes {
  display: flex;
  gap: 15px;
  justify-content: center;
  position: relative;
}

.eye {
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.05s ease-out;
}

.pupil {
  width: 8px;
  height: 8px;
  background: #333;
  border-radius: 50%;
}

.eyes.covered .eye {
  background: transparent;
}

.eyes.covered .pupil {
  display: none;
}

.hands {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 20px;
  width: 60px;
}

.hand {
  width: 15px;
  height: 15px;
  background: #FFE4B5;
  border-radius: 50%;
  animation: coverEyes 0.3s ease-out forwards;
}

.cat .hand { background: #B0C4DE; }
.dog .hand { background: #DEB887; }
.bear .hand { background: #8B4513; }
.rabbit .hand { background: #FFB6C1; }
.pig .hand { background: #FFB6C1; }

@keyframes coverEyes {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.nose {
  width: 12px;
  height: 10px;
  background: #333;
  border-radius: 50%;
  margin: 5px auto;
}

.mouth {
  width: 20px;
  height: 8px;
  border-bottom: 2px solid #333;
  border-radius: 0 0 10px 10px;
  margin: 0 auto;
}

.animation-tip {
  margin-top: 40px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  text-align: center;
  min-height: 24px;
}

/* 右侧表单区域 - 1/3 */
.auth-form-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: white;
  max-width: 400px;
}

.auth-form-wrapper {
  width: 100%;
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

.auth-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
  padding: 0 0 8px 0;
}

.auth-form :deep(.el-input__wrapper) {
  padding: 8px 12px;
  height: 40px;
}

.auth-form :deep(.el-input__inner) {
  height: 24px;
  line-height: 24px;
}

.auth-form :deep(.el-input__prefix) {
  color: #666;
}

.input-label {
  font-size: 14px;
  color: #666;
  min-width: 40px;
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

/* PC端 - 1:2 布局 */
@media (min-width: 1024px) {
  .auth-form-section {
    max-width: 33.333%;
  }
}

/* 移动端 - 上下布局，各占一半 */
@media (max-width: 1023px) {
  .auth-container {
    flex-direction: column;
  }

  .auth-animation-section {
    flex: 1;
    min-height: 50vh;
  }

  .auth-form-section {
    flex: 1;
    min-height: 50vh;
    max-width: 100%;
  }

  .animals {
    gap: 10px;
  }

  .animal-body {
    width: 60px;
    height: 75px;
  }

  .helmet {
    font-size: 18px;
    top: -10px;
  }

  .eye {
    width: 14px;
    height: 14px;
  }

  .pupil {
    width: 6px;
    height: 6px;
  }
}
</style>
