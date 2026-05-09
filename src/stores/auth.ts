import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const userName = ref<string | null>(localStorage.getItem(USER_KEY))

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken: string, user: string) {
    token.value = newToken
    userName.value = user
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, user)
  }

  function clearAuth() {
    token.value = null
    userName.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  function getToken(): string | null {
    return token.value
  }

  return {
    token,
    userName,
    isLoggedIn,
    setToken,
    clearAuth,
    getToken,
  }
})
