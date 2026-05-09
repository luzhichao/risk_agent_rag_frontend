const API_BASE_URL = 'http://127.0.0.1:8000'

interface ApiResult {
  code?: number
  status_code?: number
  msg: string
  data?: unknown
}

interface RequestOptions extends RequestInit {
  requireToken?: boolean
  params?: Record<string, string>
}

export async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; msg?: string }> {
  const { requireToken = true, params, ...fetchOptions } = options

  let url = `${API_BASE_URL}${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  }

  if (requireToken) {
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers['Authorization'] = token
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    const result: ApiResult = await response.json()

    const statusCode = result.code ?? result.status_code
    if (statusCode !== 200) {
      return {
        success: false,
        error: result.msg || '请求失败',
      }
    }

    return {
      success: true,
      data: result.data as T,
      msg: result.msg,
    }
  } catch {
    return {
      success: false,
      error: '网络连接失败，请检查服务器',
    }
  }
}

export type { ApiResult }