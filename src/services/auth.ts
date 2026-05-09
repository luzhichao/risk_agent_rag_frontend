import { ref } from 'vue'

const API_BASE_URL = 'http://127.0.0.1:8000'

export interface LoginRequest {
  user_name: string
  user_password: string
}

export interface RegisterRequest {
  user_name: string
  user_password: string
  phone: string
  email: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    token?: string
    user_name?: string
  }
  error?: string
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/system/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.detail || '登录失败',
        }
      }

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: '网络连接失败，请检查服务器',
      }
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/system/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.detail || '注册失败',
        }
      }

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: '网络连接失败，请检查服务器',
      }
    }
  },
}
