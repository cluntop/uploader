/* 
 * @Author: flkGit
 * @Date: 2026-02-18 10:00:00
 * @LastEditors: flkGit
 * @LastEditTime: 2026-02-18 10:00:00
 * @FilePath: /emos-uploader/src/utils/errorHandler.js
 * @Description: 标准化错误处理模块
 *
 * Copyright (c) 2026 by flkGit, All Rights Reserved.
 */

// 错误类型定义
export const ERROR_TYPES = {
  // 认证相关错误
  AUTH_ERROR: 'auth_error',
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_INVALID: 'token_invalid',
  NOT_LOGGED_IN: 'not_logged_in',
  
  // API 相关错误
  API_ERROR: 'api_error',
  NETWORK_ERROR: 'network_error',
  TIMEOUT_ERROR: 'timeout_error',
  
  // 业务逻辑错误
  BUSINESS_ERROR: 'business_error',
  VALIDATION_ERROR: 'validation_error',
  RESOURCE_NOT_FOUND: 'resource_not_found',
  
  // 系统错误
  SYSTEM_ERROR: 'system_error',
  UNKNOWN_ERROR: 'unknown_error'
}

// 错误代码定义
export const ERROR_CODES = {
  // 认证相关错误
  AUTH_REQUIRED: 401,
  TOKEN_EXPIRED: 401,
  TOKEN_INVALID: 401,
  
  // API 相关错误
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  NETWORK_ERROR: 0,
  TIMEOUT_ERROR: 0,
  
  // 业务逻辑错误
  VALIDATION_FAILED: 422,
  RESOURCE_NOT_FOUND: 404,
  BUSINESS_RULE_VIOLATION: 409
}

// 错误消息映射
const ERROR_MESSAGES = {
  [ERROR_TYPES.NOT_LOGGED_IN]: '未登录，无法执行此操作，请先登录',
  [ERROR_TYPES.TOKEN_EXPIRED]: '登录已过期，请重新登录',
  [ERROR_TYPES.TOKEN_INVALID]: '登录信息无效，请重新登录',
  [ERROR_TYPES.NETWORK_ERROR]: '网络连接失败，请检查网络设置后重试',
  [ERROR_TYPES.TIMEOUT_ERROR]: '请求超时，请稍后重试',
  [ERROR_TYPES.RESOURCE_NOT_FOUND]: '未找到相关资源',
  [ERROR_TYPES.VALIDATION_ERROR]: '输入参数验证失败',
  [ERROR_TYPES.SYSTEM_ERROR]: '系统内部错误，请稍后重试',
  [ERROR_TYPES.UNKNOWN_ERROR]: '未知错误，请稍后重试'
}

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN_ERROR, code = null, details = null) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

/**
 * 创建标准化错误
 * @param {string} message - 错误消息
 * @param {string} type - 错误类型
 * @param {number} code - 错误代码
 * @param {Object} details - 错误详情
 * @returns {AppError} - 标准化错误对象
 */
export const createError = (message, type = ERROR_TYPES.UNKNOWN_ERROR, code = null, details = null) => {
  return new AppError(message, type, code, details)
}

/**
 * 从API响应创建错误
 * @param {Response} response - API响应对象
 * @param {Object} errorData - 错误数据
 * @returns {AppError} - 标准化错误对象
 */
export const createErrorFromResponse = (response, errorData = null) => {
  const status = response.status
  let type = ERROR_TYPES.API_ERROR
  let message = `HTTP ${status}: ${response.statusText}`
  let details = errorData
  
  // 根据状态码确定错误类型
  switch (status) {
    case 400:
      type = ERROR_TYPES.VALIDATION_ERROR
      message = errorData?.message || '请求参数错误'
      break
    case 401:
      type = ERROR_TYPES.AUTH_ERROR
      message = errorData?.message || '未授权，请重新登录'
      break
    case 404:
      type = ERROR_TYPES.RESOURCE_NOT_FOUND
      message = errorData?.message || '请求的资源不存在'
      break
    case 422:
      type = ERROR_TYPES.VALIDATION_ERROR
      message = errorData?.message || '数据验证失败'
      break
    case 500:
      type = ERROR_TYPES.SYSTEM_ERROR
      message = errorData?.message || '服务器内部错误'
      break
    default:
      break
  }
  
  return new AppError(message, type, status, details)
}

/**
 * 从网络错误创建错误
 * @param {Error} error - 原始错误对象
 * @returns {AppError} - 标准化错误对象
 */
export const createErrorFromNetwork = (error) => {
  let type = ERROR_TYPES.NETWORK_ERROR
  let message = '网络连接失败'
  
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    type = ERROR_TYPES.TIMEOUT_ERROR
    message = '请求超时，请稍后重试'
  } else if (error.message.includes('Network')) {
    message = '网络连接失败，请检查网络设置后重试'
  }
  
  return new AppError(message, type, ERROR_CODES.NETWORK_ERROR, { originalError: error.message })
}

/**
 * 记录错误日志
 * @param {Error|AppError} error - 错误对象
 * @param {string} context - 错误上下文
 */
export const logError = (error, context = 'Unknown context') => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    name: error.name,
    message: error.message,
    stack: error.stack,
    type: error.type || ERROR_TYPES.UNKNOWN_ERROR,
    code: error.code || null,
    details: error.details || null
  }
  
  console.error('Error:', errorInfo)
  
  // 这里可以添加错误日志上报逻辑
  // 例如：上报到监控系统、日志服务等
}

/**
 * 获取用户友好的错误消息
 * @param {Error|AppError} error - 错误对象
 * @returns {string} - 用户友好的错误消息
 */
export const getUserFriendlyMessage = (error) => {
  if (error.type && ERROR_MESSAGES[error.type]) {
    return ERROR_MESSAGES[error.type]
  }
  
  if (error.code === ERROR_CODES.AUTH_REQUIRED) {
    return ERROR_MESSAGES[ERROR_TYPES.NOT_LOGGED_IN]
  }
  
  if (error.code === ERROR_CODES.NETWORK_ERROR || error.message.includes('Network')) {
    return ERROR_MESSAGES[ERROR_TYPES.NETWORK_ERROR]
  }
  
  if (error.code === ERROR_CODES.TIMEOUT_ERROR || error.message.includes('timeout')) {
    return ERROR_MESSAGES[ERROR_TYPES.TIMEOUT_ERROR]
  }
  
  return error.message || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR]
}

/**
 * 处理错误
 * @param {Error|AppError} error - 错误对象
 * @param {string} context - 错误上下文
 * @returns {AppError} - 标准化错误对象
 */
export const handleError = (error, context = 'Unknown context') => {
  // 记录错误日志
  logError(error, context)
  
  // 如果已经是标准化错误，直接返回
  if (error instanceof AppError) {
    return error
  }
  
  // 处理网络错误
  if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
    return createErrorFromNetwork(error)
  }
  
  // 处理超时错误
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return createErrorFromNetwork(error)
  }
  
  // 处理其他错误
  return createError(
    error.message || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR],
    ERROR_TYPES.UNKNOWN_ERROR,
    null,
    { originalError: error.message, stack: error.stack }
  )
}

/**
 * 格式化错误响应
 * @param {AppError} error - 标准化错误对象
 * @returns {Object} - 格式化的错误响应
 */
export const formatErrorResponse = (error) => {
  return {
    success: false,
    error: {
      message: error.message,
      type: error.type,
      code: error.code,
      details: error.details,
      timestamp: error.timestamp || new Date().toISOString()
    }
  }
}

/**
 * 检查错误是否可重试
 * @param {AppError} error - 标准化错误对象
 * @returns {boolean} - 是否可重试
 */
export const isRetryableError = (error) => {
  const retryableTypes = [
    ERROR_TYPES.NETWORK_ERROR,
    ERROR_TYPES.TIMEOUT_ERROR,
    ERROR_TYPES.SYSTEM_ERROR
  ]
  
  return retryableTypes.includes(error.type)
}

// 导出默认对象
export default {
  ERROR_TYPES,
  ERROR_CODES,
  AppError,
  createError,
  createErrorFromResponse,
  createErrorFromNetwork,
  logError,
  getUserFriendlyMessage,
  handleError,
  formatErrorResponse,
  isRetryableError
}
