const API_BASE_URL = 'http://127.0.0.1:8000'

export interface UploadResult {
  success: boolean
  data?: string[]
  error?: string
}

export const uploadService = {
  async uploadRiskImages(files: File[]): Promise<UploadResult> {
    const token = localStorage.getItem('auth_token')
    
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/file/upload_risk_images`, {
        method: 'POST',
        headers: {
          'Authorization': token || '',
        },
        body: formData,
      })

      const result = await response.json()

      if (result.status_code === 200) {
        return {
          success: true,
          data: result.data as string[],
        }
      } else {
        return {
          success: false,
          error: result.msg || '上传失败',
        }
      }
    } catch {
      return {
        success: false,
        error: '网络连接失败，请检查服务器',
      }
    }
  },
}
