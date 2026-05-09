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
  data?: unknown
  error?: string
  msg?: string
}

interface ApiResult {
  code: number
  msg: string
  data?: unknown
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

      const result: ApiResult = await response.json()

      if (result.code !== 200) {
        return {
          success: false,
          error: result.msg || '登录失败',
        }
      }

      return {
        success: true,
        data: result.data as { token?: string; user_name?: string },
        msg: result.msg,
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

      const result: ApiResult = await response.json()

      if (result.code !== 200) {
        return {
          success: false,
          error: result.msg || '注册失败',
        }
      }

      return {
        success: true,
        data: result.data as { token?: string; user_name?: string },
        msg: result.msg,
      }
    } catch (error) {
      return {
        success: false,
        error: '网络连接失败，请检查服务器',
      }
    }
  },
}
