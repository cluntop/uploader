import { ref } from 'vue'
import { API_ENDPOINTS, ERROR_CONFIG } from '../config'
import api from '../utils/api'

export function useUploadToken() {
  const uploadToken = ref(null)
  const isGettingToken = ref(false)
  const tokenError = ref(null)

  // 获取上传令牌
  const getUploadToken = async (type, fileType, fileName, fileSize, fileStorage = 'default') => {
    isGettingToken.value = true
    tokenError.value = null

    try {
      // 准备请求数据
      const requestData = {
        type: type,           // video/subtitle/cover
        file_type: fileType,  // MIME type
        file_name: fileName,  // name with extension
        file_size: fileSize,  // file size in bytes
        file_storage: fileStorage // default/global/internal
      }

      // 使用 api 工具获取上传令牌
      const data = await api.post(API_ENDPOINTS.UPLOAD_TOKEN, requestData)

      // 保存令牌信息
      uploadToken.value = {
        type: data.type,
        file_id: data.file_id,
        upload_url: data.data.upload_url
      }

      console.log('获取上传令牌成功:', uploadToken.value)
      return uploadToken.value
    } catch (err) {
      console.error('获取上传令牌失败:', err)
      // 处理错误消息
      if (err.message.includes('401')) {
        tokenError.value = ERROR_CONFIG.ERROR_MESSAGES.AUTH_ERROR
      } else if (err.message.includes('Network')) {
        tokenError.value = ERROR_CONFIG.ERROR_MESSAGES.NETWORK_ERROR
      } else if (err.message.includes('50')) {
        tokenError.value = ERROR_CONFIG.ERROR_MESSAGES.SERVER_ERROR
      } else if (err.message.includes('422') || err.message.includes('视频正在合成中')) {
        tokenError.value = '视频正在合成中'
        throw new Error('视频正在合成中')
      } else {
        tokenError.value = ERROR_CONFIG.SHOW_DETAILED_ERRORS ? err.message : ERROR_CONFIG.ERROR_MESSAGES.SERVER_ERROR
      }
      throw err
    } finally {
      isGettingToken.value = false
    }
  }

  // 保存上传结果
  const saveUploadResult = async (fileId, itemType, itemId) => {
    try {
      // 准备请求数据
      const requestData = {
        file_id: fileId,
        item_type: itemType,
        item_id: itemId
      }

      // 使用 api 工具保存上传结果
      const data = await api.post(API_ENDPOINTS.SAVE_UPLOAD, requestData)

      console.log('保存上传结果成功:', data)
      return data
    } catch (err) {
      console.error('保存上传结果失败:', err)
      // 处理错误消息
      if (err.message.includes('401')) {
        tokenError.value = ERROR_CONFIG.ERROR_MESSAGES.AUTH_ERROR
      } else if (err.message.includes('Network')) {
        tokenError.value = ERROR_CONFIG.ERROR_MESSAGES.NETWORK_ERROR
      } else if (err.message.includes('50')) {
        tokenError.value = ERROR_CONFIG.ERROR_MESSAGES.SERVER_ERROR
      } else if (err.message.includes('422') || err.message.includes('视频正在合成中')) {
        tokenError.value = '视频正在合成中'
        throw new Error('视频正在合成中')
      } else {
        tokenError.value = ERROR_CONFIG.SHOW_DETAILED_ERRORS ? err.message : ERROR_CONFIG.ERROR_MESSAGES.SERVER_ERROR
      }
      throw err
    }
  }

  // 清除令牌
  const clearToken = () => {
    uploadToken.value = null
    tokenError.value = null
  }

  return {
    uploadToken,
    isGettingToken,
    tokenError,
    getUploadToken,
    saveUploadResult,
    clearToken
  }
}
