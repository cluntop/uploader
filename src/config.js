/* 
 * @Author: flkGit
 * @Date: 2025-10-17 10:27:32
 * @LastEditors: flkGit
 * @LastEditTime: 2026-01-29 10:00:00
 * @FilePath: /emos-uploader/src/config.js
 * @Description: 全局配置
 *
 * Copyright (c) 2026 by flkGit, All Rights Reserved.
 */

// API 基础配置
export const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://emos.best'

// API 端点配置
export const API_ENDPOINTS = {
  // 视频相关
  VIDEO_TREE: '/api/video/tree',
  VIDEO_LIST: '/api/video/list',
  VIDEO_SEARCH: '/api/video/search',
  GET_VIDEO_ID: '/api/video/getVideoId',
  MEDIA_LIST: '/api/video/media/list',
  SUBTITLE_LIST: '/api/video/subtitle/list',
  
  // 上传相关
  VIDEO_INFO: '/api/upload/video/base',
  UPLOAD_TOKEN: '/api/upload/getUploadToken',
  SAVE_VIDEO: '/api/upload/video/save',
  SAVE_SUBTITLE: '/api/upload/subtitle/save'
}

// 分片配置
export const CHUNK_SIZE = 100 * 1024 * 1024 // 100MB 每片
export const MIN_CHUNK_SIZE = 50 * 1024 * 1024 // 50MB 最小分片大小

// API 超时设置（毫秒）
export const API_TIMEOUT = 30 * 1000 // 30秒

// 缓存配置
export const CACHE_CONFIG = {
  // 缓存过期时间（毫秒）
  EXPIRY: 5 * 60 * 1000, // 5分钟
  // 是否启用缓存
  ENABLED: true
}

// 重试配置
export const RETRY_CONFIG = {
  // 最大重试次数
  MAX_ATTEMPTS: 3,
  // 初始重试延迟（毫秒）
  DELAY: 1000,
  // 重试延迟倍数
  BACKOFF: 2
}

// 网络配置
export const NETWORK_CONFIG = {
  // 上传并发数
  CONCURRENT_UPLOADS: 3,
  // 连接超时（毫秒）
  CONNECTION_TIMEOUT: 10 * 1000
}

// 错误处理配置
export const ERROR_CONFIG = {
  // 是否显示详细错误信息
  SHOW_DETAILED_ERRORS: true,
  // 错误消息模板
  ERROR_MESSAGES: {
    NETWORK_ERROR: '网络连接失败，请检查您的网络',
    AUTH_ERROR: '认证失败，请重新登录',
    SERVER_ERROR: '服务器错误，请稍后重试',
    UPLOAD_ERROR: '上传失败，请稍后重试'
  }
}
