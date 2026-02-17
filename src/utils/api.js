/* 
 * @Author: flkGit
 * @Date: 2026-01-29 10:00:00
 * @LastEditors: flkGit
 * @LastEditTime: 2026-01-29 10:00:00
 * @FilePath: /emos-uploader/src/utils/api.js
 * @Description: 全局 API 请求封装
 *
 * Copyright (c) 2026 by flkGit, All Rights Reserved.
 */
import { BASE_URL } from '../config'
import { getToken } from './auth'
import { handleError, createErrorFromResponse, createErrorFromNetwork } from './errorHandler'

// 缓存对象
const cache = new Map()

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = 5 * 60 * 1000 // 5分钟

// 缓存大小限制
const MAX_CACHE_SIZE = 50

// 重试配置
const RETRY_CONFIG = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 2
}

// 生成缓存键
const generateCacheKey = (url, options) => {
  const key = `${url}_${JSON.stringify(options || {})}`
  return key
}

// 检查缓存是否有效
const isCacheValid = (cachedData) => {
  if (!cachedData) return false
  const { timestamp, data } = cachedData
  const now = Date.now()
  return now - timestamp < CACHE_EXPIRY && data !== undefined
}

// 获取认证令牌
const getAuthToken = () => {
  return getToken()
}

// 构建请求选项
const buildRequestOptions = (options = {}) => {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-API-Client': 'emos-uploader',
    ...options.headers
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // 确保请求方法正确设置
  const method = options.method || 'GET'

  return {
    ...options,
    method,
    headers,
    // 添加请求超时设置
    timeout: options.timeout || 30000
  }
}

// 处理 API 响应
const handleResponse = async (response) => {
  if (!response.ok) {
    // 尝试解析错误响应
    try {
      const errorData = await response.json()
      // 特殊处理 HTTP 422 错误
      if (response.status === 422) {
        errorData.message = '视频正在合成中'
      }
      const error = createErrorFromResponse(response, errorData)
      throw error
    } catch (e) {
      // 特殊处理 HTTP 422 错误
      if (response.status === 422) {
        const errorData = { message: '视频正在合成中' }
        const error = createErrorFromResponse(response, errorData)
        throw error
      }
      const error = createErrorFromResponse(response)
      throw error
    }
  }

  // 尝试解析响应
  try {
    return await response.json()
  } catch (e) {
    try {
      // 尝试解析文本响应
      const text = await response.text()
      // 检查是否是 JSON 格式的文本
      if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
        return JSON.parse(text)
      }
      return text
    } catch (e) {
      return null
    }
  }
}

// 重试机制
const retryRequest = async (url, options, attempt = 1) => {
  try {
    console.log(`API 请求 (${attempt}/${RETRY_CONFIG.maxAttempts}): ${url}`)
    
    // 添加请求超时处理
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000)
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    console.log(`API 响应状态: ${response.status}`)
    return await handleResponse(response)
  } catch (error) {
    console.error(`API 请求失败 (${attempt}/${RETRY_CONFIG.maxAttempts}):`, error)
    
    // 处理错误
    const handledError = handleError(error, `API 请求: ${url}`)
    
    // 只对网络错误或 5xx 错误进行重试
    if (attempt < RETRY_CONFIG.maxAttempts && 
        (handledError.type === 'network_error' || handledError.type === 'timeout_error' || handledError.type === 'system_error' || handledError.status >= 500)) {
      const delay = RETRY_CONFIG.delay * Math.pow(RETRY_CONFIG.backoff, attempt - 1)
      console.log(`正在重试 (${attempt}/${RETRY_CONFIG.maxAttempts})，延迟 ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryRequest(url, options, attempt + 1)
    }
    throw handledError
  }
}

// API 请求封装
const api = {
  // GET 请求
  get: async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`
    const cacheKey = generateCacheKey(url, options)
    
    // 检查缓存
    const cachedData = cache.get(cacheKey)
    if (isCacheValid(cachedData)) {
      return cachedData.data
    }

    const requestOptions = buildRequestOptions({
      ...options,
      method: 'GET'
    })

    const data = await retryRequest(url, requestOptions)

    // 缓存响应，检查缓存大小
    if (cache.size >= MAX_CACHE_SIZE) {
      // 移除最早的缓存项
      const oldestKey = cache.keys().next().value
      cache.delete(oldestKey)
    }
    
    // 缓存响应
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })

    return data
  },

  // POST 请求
  post: async (endpoint, data = {}, options = {}) => {
    const url = `${BASE_URL}${endpoint}`

    const requestOptions = buildRequestOptions({
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    })

    return await retryRequest(url, requestOptions)
  },

  // PUT 请求
  put: async (endpoint, data = {}, options = {}) => {
    const url = `${BASE_URL}${endpoint}`

    const requestOptions = buildRequestOptions({
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    })

    return await retryRequest(url, requestOptions)
  },

  // DELETE 请求
  delete: async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`

    const requestOptions = buildRequestOptions({
      ...options,
      method: 'DELETE'
    })

    return await retryRequest(url, requestOptions)
  },

  // 上传文件
  upload: async (url, file, options = {}) => {
    const { onProgress, chunkSize, ...otherOptions } = options

    const requestOptions = buildRequestOptions({
      ...otherOptions,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        ...otherOptions.headers
      }
    })

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100)
            onProgress(percent)
          }
        })
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const responseData = JSON.parse(xhr.responseText)
            resolve(responseData)
          } catch (e) {
            resolve(xhr.responseText)
          }
        } else {
          reject(new Error(`上传失败: ${xhr.status} ${xhr.statusText}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('网络错误'))
      })

      xhr.addEventListener('abort', () => {
        reject(new Error('上传已取消'))
      })

      xhr.open('PUT', url)

      // 设置请求头
      Object.entries(requestOptions.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })

      // 发送文件
      xhr.send(file)
    })
  },

  // 清除缓存
  clearCache: (endpoint) => {
    if (endpoint) {
      const url = `${BASE_URL}${endpoint}`
      // 清除与该端点相关的所有缓存
      for (const key of cache.keys()) {
        if (key.startsWith(url)) {
          cache.delete(key)
        }
      }
    } else {
      // 清除所有缓存
      cache.clear()
    }
  }
}

export default api