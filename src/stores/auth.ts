import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'
const USER_INFO_KEY = 'auth_user_info'

export interface UserInfo {
  user_id?: number
  user_name: string
  email?: string
  phone?: string
  created_at?: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const userName = ref<string | null>(localStorage.getItem(USER_KEY))
  const userInfo = ref<UserInfo | null>(JSON.parse(localStorage.getItem(USER_INFO_KEY) || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken: string, user: string) {
    token.value = newToken
    userName.value = user
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, user)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
  }

  function clearAuth() {
    token.value = null
    userName.value = null
    userInfo.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(USER_INFO_KEY)
  }

  function logout() {
    clearAuth()
  }

  function getToken(): string | null {
    return token.value
  }

  return {
    token,
    userName,
    userInfo,
    isLoggedIn,
    setToken,
    setUserInfo,
    clearAuth,
    logout,
    getToken,
  }
})
