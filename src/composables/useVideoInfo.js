import { ref } from 'vue'
import { API_ENDPOINTS, ERROR_CONFIG } from '../config'
import api from '../utils/api'

export function useVideoInfo() {
  const videoId = ref('')
  const videoInfo = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const isValid = ref(false)
  const fileStorage = ref('default') // 默认存储位置

  // 验证视频 ID 格式
  const validateVideoId = (value) => {
    const pattern = /^(vl|ve)-\d+$/
    return pattern.test(value)
  }

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // 获取视频信息
  const fetchVideoInfo = async () => {
    const id = videoId.value.trim()

    if (!id) {
      error.value = '请先输入视频 ID'
      return false
    }

    if (!validateVideoId(id)) {
      error.value = '视频 ID 格式不正确'
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      // 解析视频 ID，提取 item_type 和 item_id
      const match = id.match(/^(vl|ve)-(\d+)$/)
      if (!match) {
        throw new Error('视频 ID 格式错误')
      }

      const item_type = match[1]
      const item_id = match[2]

      // 构建查询参数
      const params = new URLSearchParams({
        item_type,
        item_id
      }).toString()

      // 使用 api 工具获取视频信息
      const data = await api.get(`${API_ENDPOINTS.VIDEO_INFO}?${params}`)
      videoInfo.value = data

      console.log('视频信息:', data)
      return true
    } catch (err) {
      console.error('获取视频信息失败:', err)
      // 处理错误消息
      if (err.message.includes('401')) {
        error.value = ERROR_CONFIG.ERROR_MESSAGES.AUTH_ERROR
      } else if (err.message.includes('Network') || err.message.includes('Failed to fetch')) {
        error.value = ERROR_CONFIG.ERROR_MESSAGES.NETWORK_ERROR
      } else if (err.message.includes('50')) {
        error.value = ERROR_CONFIG.ERROR_MESSAGES.SERVER_ERROR
      } else {
        error.value = ERROR_CONFIG.SHOW_DETAILED_ERRORS ? err.message : ERROR_CONFIG.ERROR_MESSAGES.SERVER_ERROR
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 更新验证状态
  const updateValidation = (value) => {
    if (value === '') {
      isValid.value = false
      error.value = null
    } else if (validateVideoId(value)) {
      isValid.value = true
      error.value = null
    } else {
      isValid.value = false
      // 不设置 error，只通过 isValid 来标记验证状态
    }
  }

  // 清除视频信息
  const clearVideoInfo = () => {
    videoId.value = ''
    videoInfo.value = null
    isValid.value = false
    error.value = null
    fileStorage.value = 'default'
  }

  return {
    videoId,
    videoInfo,
    isLoading,
    error,
    isValid,
    fileStorage,
    validateVideoId,
    fetchVideoInfo,
    updateValidation,
    formatFileSize,
    clearVideoInfo
  }
}
