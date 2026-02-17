import { ref } from 'vue'
import { CHUNK_SIZE, MIN_CHUNK_SIZE, NETWORK_CONFIG, ERROR_CONFIG } from '../config'
import api from '../utils/api'
import { searchItemId, addManualMap } from '../utils/recognize'

export function useUpload() {
  const uploadProgress = ref(0)
  const uploadSpeed = ref('')
  const isUploading = ref(false)
  const lastUploadedFile = ref(null)
  const canResume = ref(false)
  let currentUploadController = null

  // 生成文件唯一标识
  const getFileIdentifier = (file) => {
    return `${file.name}_${file.size}_${file.lastModified}`
  }

  // 保存上传进度到 localStorage
  const saveUploadProgress = (fileId, chunkIndex, totalChunks, uploadUrl) => {
    const progress = {
      fileId,
      chunkIndex,
      totalChunks,
      uploadUrl,  // 保存 upload_url 用于验证 session
      timestamp: Date.now()
    }
    localStorage.setItem('upload_progress', JSON.stringify(progress))
  }

  // 获取上传进度
  const getUploadProgress = (fileId, uploadUrl) => {
    try {
      const saved = localStorage.getItem('upload_progress')
      if (saved) {
        const progress = JSON.parse(saved)

        // 检查是否是同一个文件
        if (progress.fileId !== fileId) {
          return null
        }

        // 检查是否超过24小时
        if ((Date.now() - progress.timestamp) >= 24 * 60 * 60 * 1000) {
          console.log('断点续传记录已过期(超过24小时)')
          return null
        }

        // 关键: 检查 upload_url 是否相同 (同一个 upload session)
        if (progress.uploadUrl !== uploadUrl) {
          console.warn('upload_url 不匹配,可能是新的 upload session,清除旧的断点记录')
          clearUploadProgress()
          return null
        }

        return progress
      }
    } catch (e) {
      console.error('读取上传进度失败:', e)
    }
    return null
  }

  // 清除上传进度
  const clearUploadProgress = () => {
    localStorage.removeItem('upload_progress')
    canResume.value = false
  }

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // 上传单个分片
  const uploadChunk = async (chunk, start, end, total, uploadUrl, attempt = 1) => {
    try {
      // 使用 api 工具上传分片
      const response = await api.upload(uploadUrl, chunk, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Range': `bytes ${start}-${end}/${total}`
        }
      })
      return response
    } catch (error) {
      // 重试机制
      if (attempt < 3 && (error.message.includes('Network') || error.message.includes('50'))) {
        const delay = 1000 * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        console.log(`分片上传失败，正在重试 (${attempt}/3)...`)
        return uploadChunk(chunk, start, end, total, uploadUrl, attempt + 1)
      }
      throw error
    }
  }

  // 分片上传文件（支持断点续传）
  const uploadFileInChunks = async (file, uploadUrl, onProgress, resumeFrom = 0) => {
    const total = file.size
    const chunkSize = CHUNK_SIZE
    const chunks = Math.ceil(total / chunkSize)
    const fileId = getFileIdentifier(file)

    let uploadedBytes = resumeFrom * chunkSize
    const startTime = Date.now()
    let lastChunkResponse = null

    console.log(`开始分片上传: 文件大小 ${formatFileSize(total)}, 分片数 ${chunks}, 每片 ${formatFileSize(chunkSize)}`)
    if (resumeFrom > 0) {
      console.log(`从第 ${resumeFrom + 1} 个分片继续上传（断点续传）`)
    }

    try {
      for (let i = resumeFrom; i < chunks; i++) {
        const start = i * chunkSize
        const end = Math.min(start + chunkSize, total) - 1
        
        // 优化：使用 Blob.slice 而不是 File.slice，提高性能
        let chunk = file.slice(start, end + 1)

        console.log(`上传分片 ${i + 1}/${chunks}: bytes ${start}-${end}/${total}`)

        if (onProgress) {
          onProgress(`正在上传分片 ${i + 1}/${chunks}...`, 'uploading')
        }

        const response = await uploadChunk(chunk, start, end, total, uploadUrl)

        // 保存最后一片的响应（包含完整文件信息）
        if (i === chunks - 1) {
          try {
            lastChunkResponse = typeof response === 'string' ? JSON.parse(response) : response
          } catch (e) {
            lastChunkResponse = response
          }
        }

        // 保存进度 (包含 uploadUrl)
        saveUploadProgress(fileId, i, chunks, uploadUrl)

        uploadedBytes = end + 1
        const percent = Math.round((uploadedBytes / total) * 100)
        uploadProgress.value = percent

        // 计算上传速度
        const elapsed = (Date.now() - startTime) / 1000
        const speed = uploadedBytes / elapsed
        uploadSpeed.value = formatFileSize(speed) + '/s'

        console.log(`分片 ${i + 1} 上传成功`)

        // 优化：释放分片内存
        chunk = null
      }

      // 上传完成，清除进度
      clearUploadProgress()
      console.log('所有分片上传完成')

      // 返回最后一片的响应数据
      return lastChunkResponse
    } catch (error) {
      // 上传失败，保持进度记录，允许断点续传
      console.error('分片上传失败，已保存进度，可以断点续传:', error)
      canResume.value = true
      // 处理错误消息
      let errorMessage = '上传失败，请稍后重试'
      if (error.message.includes('Network')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.NETWORK_ERROR
      } else if (error.message.includes('50')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.SERVER_ERROR
      } else if (error.message.includes('422') || error.message.includes('视频正在合成中')) {
        errorMessage = '视频正在合成中'
      } else if (error.message.includes('401') || error.message.includes('认证')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.AUTH_ERROR
      } else if (error.message.includes('403')) {
        errorMessage = '权限不足，无法上传文件'
      } else if (error.message.includes('404')) {
        errorMessage = '上传地址无效，请重新获取'
      } else {
        errorMessage = ERROR_CONFIG.SHOW_DETAILED_ERRORS ? error.message : ERROR_CONFIG.ERROR_MESSAGES.UPLOAD_ERROR
      }
      throw new Error(errorMessage)
    }
  }

  // 完整上传（小文件）
  const uploadFileComplete = async (file, uploadUrl) => {
    const start = 0
    const end = file.size - 1
    const total = file.size
    const startTime = Date.now()

    console.log(`开始完整上传: ${formatFileSize(total)}`)

    try {
      // 使用 api 工具上传文件
      const response = await api.upload(uploadUrl, file, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Range': `bytes ${start}-${end}/${total}`
        },
        onProgress: (percent) => {
          uploadProgress.value = percent

          // 计算上传速度
          const elapsed = (Date.now() - startTime) / 1000
          const speed = (percent / 100) * total / elapsed
          uploadSpeed.value = formatFileSize(speed) + '/s'
        }
      })

      console.log('上传响应:', response)
      // 解析并返回响应数据
      return typeof response === 'string' ? JSON.parse(response) : response
    } catch (error) {
      console.error('上传失败:', error)
      // 处理错误消息
      let errorMessage = '上传失败，请稍后重试'
      if (error.message.includes('Network')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.NETWORK_ERROR
      } else if (error.message.includes('50')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.SERVER_ERROR
      } else if (error.message.includes('422') || error.message.includes('视频正在合成中')) {
        errorMessage = '视频正在合成中'
      } else if (error.message.includes('401') || error.message.includes('认证')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.AUTH_ERROR
      } else if (error.message.includes('403')) {
        errorMessage = '权限不足，无法上传文件'
      } else if (error.message.includes('404')) {
        errorMessage = '上传地址无效，请重新获取'
      } else {
        errorMessage = ERROR_CONFIG.SHOW_DETAILED_ERRORS ? error.message : ERROR_CONFIG.ERROR_MESSAGES.UPLOAD_ERROR
      }
      throw new Error(errorMessage)
    }
  }

  // 获取上传基础信息
  const getUploadBase = async (itemType, itemId) => {
    try {
      await api.get('/api/upload/video/base', {
        params: {
          item_type: itemType,
          item_id: itemId
        }
      })
    } catch (e) {
      console.error('获取上传基础信息失败:', e)
      let errorMessage = '获取上传基础信息失败'
      if (e.message.includes('Network')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.NETWORK_ERROR
      } else if (e.message.includes('401') || e.message.includes('认证')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.AUTH_ERROR
      } else if (e.message.includes('403')) {
        errorMessage = '权限不足，无法获取上传信息'
      } else if (e.message.includes('404')) {
        errorMessage = '视频信息不存在'
      } else {
        errorMessage = e.message || errorMessage
      }
      throw new Error(errorMessage)
    }
  }

  // 获取上传令牌
  const getUploadToken = async (payload) => {
    try {
      const response = await api.post('/api/upload/getUploadToken', payload)
      return response
    } catch (e) {
      console.error('获取上传令牌失败:', e)
      let errorMessage = '获取上传令牌失败'
      if (e.message.includes('Network')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.NETWORK_ERROR
      } else if (e.message.includes('401') || e.message.includes('认证')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.AUTH_ERROR
      } else if (e.message.includes('403')) {
        errorMessage = '权限不足，无法获取上传令牌'
      } else {
        errorMessage = e.message || errorMessage
      }
      throw new Error(errorMessage)
    }
  }

  // 保存上传结果
  const saveUpload = async (payload, isSubtitle = false) => {
    try {
      if (isSubtitle) {
        return await api.post('/api/upload/subtitle/save', payload)
      } else {
        return await api.post('/api/upload/video/save', payload)
      }
    } catch (e) {
      console.error('保存上传结果失败:', e)
      let errorMessage = '保存上传结果失败'
      if (e.message.includes('Network')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.NETWORK_ERROR
      } else if (e.message.includes('401') || e.message.includes('认证')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.AUTH_ERROR
      } else if (e.message.includes('403')) {
        errorMessage = '权限不足，无法保存上传结果'
      } else if (e.message.includes('404')) {
        errorMessage = '视频信息不存在'
      } else {
        errorMessage = e.message || errorMessage
      }
      throw new Error(errorMessage)
    }
  }

  // 获取资源列表
  const getMediaList = async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.MEDIA_LIST, {
        params: {
          video_list_id: params.video_list_id || '',
          video_season_id: params.video_season_id || '',
          video_episode_id: params.video_episode_id || '',
          video_part_id: params.video_part_id || ''
        }
      })
      return response
    } catch (e) {
      console.error('获取资源列表失败:', e)
      let errorMessage = '获取资源列表失败'
      if (e.message.includes('Network')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.NETWORK_ERROR
      } else if (e.message.includes('401') || e.message.includes('认证')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.AUTH_ERROR
      } else if (e.message.includes('403')) {
        errorMessage = '权限不足，无法获取资源列表'
      } else {
        errorMessage = e.message || errorMessage
      }
      throw new Error(errorMessage)
    }
  }

  // 获取字幕列表
  const getSubtitleList = async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.SUBTITLE_LIST, {
        params: {
          video_list_id: params.video_list_id || '',
          video_episode_id: params.video_episode_id || '',
          video_part_id: params.video_part_id || '',
          video_media_id: params.video_media_id || ''
        }
      })
      return response
    } catch (e) {
      console.error('获取字幕列表失败:', e)
      let errorMessage = '获取字幕列表失败'
      if (e.message.includes('Network')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.NETWORK_ERROR
      } else if (e.message.includes('401') || e.message.includes('认证')) {
        errorMessage = ERROR_CONFIG.ERROR_MESSAGES.AUTH_ERROR
      } else if (e.message.includes('403')) {
        errorMessage = '权限不足，无法获取字幕列表'
      } else {
        errorMessage = e.message || errorMessage
      }
      throw new Error(errorMessage)
    }
  }

  // 上传文件（自动选择分片或完整上传，支持断点续传）
  const uploadFile = async (file, uploadUrl, onProgress) => {
    if (!file || !uploadUrl) {
      if (onProgress) {
        onProgress('文件或上传 URL 不能为空', 'error')
      }
      return null
    }

    // 保存文件以便重新上传
    lastUploadedFile.value = file

    // 重置进度
    uploadProgress.value = 0
    uploadSpeed.value = ''
    isUploading.value = true
    canResume.value = false

    try {
      if (onProgress) {
        onProgress('正在准备上传...', 'uploading')
      }

      let uploadResponse = null

      // 根据文件大小选择上传方式
      if (file.size > MIN_CHUNK_SIZE) {
        console.log('使用分片上传模式')

        // 检查是否有断点 (传入 uploadUrl 验证 session)
        const fileId = getFileIdentifier(file)
        const savedProgress = getUploadProgress(fileId, uploadUrl)

        if (savedProgress && savedProgress.chunkIndex >= 0) {
          const resumeFrom = savedProgress.chunkIndex + 1
          console.log(`检测到断点，从第 ${resumeFrom + 1} 个分片继续上传`)
          if (onProgress) {
            onProgress(`检测到上传记录，从第 ${resumeFrom + 1} 个分片继续...`, 'uploading')
          }
          uploadResponse = await uploadFileInChunks(file, uploadUrl, onProgress, resumeFrom)
        } else {
          uploadResponse = await uploadFileInChunks(file, uploadUrl, onProgress, 0)
        }
      } else {
        console.log('使用完整上传模式')
        uploadResponse = await uploadFileComplete(file, uploadUrl)
      }

      if (onProgress) {
        onProgress('上传成功！', 'success')
      }

      // 返回上传响应数据
      return uploadResponse
    } catch (error) {
      console.error('上传异常:', error)
      let errorMessage = '上传失败，请稍后重试'
      
      // 根据错误类型提供更准确的提示
      if (error.message.includes('Network')) {
        errorMessage = '网络连接失败，请检查您的网络'
      } else if (error.message.includes('50')) {
        errorMessage = '服务器错误，请稍后重试'
      } else if (error.message.includes('422') || error.message.includes('视频正在合成中')) {
        errorMessage = '视频正在合成中，请稍后再试'
      } else if (error.message.includes('401') || error.message.includes('认证')) {
        errorMessage = '认证失败，请重新登录'
      } else if (error.message.includes('403')) {
        errorMessage = '权限不足，无法上传文件'
      } else if (error.message.includes('404')) {
        errorMessage = '上传地址无效，请重新获取'
      } else {
        errorMessage = error.message || errorMessage
      }
      
      if (onProgress) {
        onProgress(`上传出错: ${errorMessage}`, 'error')
      }
      throw error
    } finally {
      isUploading.value = false
      currentUploadController = null
    }
  }

  // 完整上传流程（包含识别和保存）
  const uploadWithRecognition = async (file, onProgress) => {
    if (!file) {
      if (onProgress) {
        onProgress('文件不能为空', 'error')
      }
      return null
    }

    // 重置进度
    uploadProgress.value = 0
    uploadSpeed.value = ''
    isUploading.value = true
    canResume.value = false

    try {
      if (onProgress) {
        onProgress('正在识别文件...', 'uploading')
      }

      // 识别文件
      const info = await searchItemId(file.name, console)
      
      if (!info) {
        throw new Error('文件识别失败')
      }

      if (onProgress) {
        onProgress(`识别成功: ${info.title}`, 'uploading')
      }

      // 步骤1: 获取上传基础信息
      if (onProgress) {
        onProgress('获取上传基础信息...', 'uploading')
      }
      await getUploadBase(info.item_type, info.video_id)

      // 确定文件类型
      const ext = file.name.split('.').pop().toLowerCase()
      const isSubtitle = ['srt', 'ass', 'ssa', 'vtt'].includes(ext)
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)
      
      // MIME 类型映射
      const mimeMap = {
        'mp4': 'video/mp4',
        'mkv': 'video/mp4',
        'avi': 'video/mp4',
        'mov': 'video/quicktime',
        'srt': 'application/x-subrip',
        'ass': 'text/x-ssa',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp'
      }
      
      const mime = mimeMap[ext] || 'application/octet-stream'

      // 步骤2: 获取上传令牌
      if (onProgress) {
        onProgress('获取上传令牌...', 'uploading')
      }
      let uploadType = 'video'
      if (isSubtitle) {
        uploadType = 'subtitle'
      } else if (isImage) {
        uploadType = 'image'
      }
      
      const tokenPayload = {
        type: uploadType,
        file_type: mime,
        file_name: file.name,
        file_size: file.size,
        file_storage: 'default'
      }

      const tokenData = await getUploadToken(tokenPayload)

      if (!tokenData.data || !tokenData.data.upload_url) {
        throw new Error('获取上传令牌失败')
      }

      const uploadUrl = tokenData.data.upload_url

      if (onProgress) {
        onProgress('正在上传文件...', 'uploading')
      }

      // 上传文件
      await uploadFile(file, uploadUrl, onProgress)

      // 步骤3: 保存上传结果
      if (onProgress) {
        onProgress('保存上传结果...', 'uploading')
      }
      const savePayload = {
        item_type: info.item_type,
        item_id: info.video_id,
        file_id: tokenData.file_id
      }

      if (isSubtitle && info.media_uuid) {
        savePayload.media_uuid = info.media_uuid
      }

      const saveResponse = await saveUpload(savePayload, isSubtitle)

      if (onProgress) {
        onProgress('上传完成！', 'success')
      }

      return saveResponse
    } catch (error) {
      console.error('上传流程异常:', error)
      if (onProgress) {
        onProgress(`上传出错: ${error.message}`, 'error')
      }
      throw error
    } finally {
      isUploading.value = false
      currentUploadController = null
    }
  }

  // 取消上传
  const cancelUpload = () => {
    if (currentUploadController) {
      currentUploadController.abort()
    }
  }

  return {
    uploadProgress,
    uploadSpeed,
    isUploading,
    lastUploadedFile,
    canResume,
    uploadFile,
    uploadWithRecognition,
    cancelUpload,
    clearUploadProgress,
    formatFileSize,
    getUploadBase,
    getUploadToken,
    saveUpload,
    getMediaList,
    getSubtitleList
  }
}
