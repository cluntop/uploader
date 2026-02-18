/**
 * @Author: flkGit
 * @Date: 2026-02-18 10:00:00
 * @LastEditors: flkGit
 * @LastEditTime: 2026-02-18 10:00:00
 * @FilePath: /emos-uploader/src/utils/auth.js
 * @Description: 统一认证管理模块
 *
 * Copyright (c) 2026 by flkGit, All Rights Reserved.
 */

import logger from './logger'

// 认证相关常量
const AUTH_CONSTANTS = {
  TOKEN_KEY: 'token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  TOKEN_EXPIRY_KEY: 'token_expiry',
  AUTH_STATUS_KEY: 'auth_status',
  USER_INFO_KEY: 'user_info',
  USER_ID_KEY: 'user_id',
  USERNAME_KEY: 'username',
  AVATAR_KEY: 'avatar',
  AUTH_UUID_KEY: 'auth_uuid',
  ORIGINAL_URL_KEY: 'original_url',
  ORIGINAL_URL_EXPIRY_KEY: 'original_url_expiry'
}

// 应用配置
const APP_CONFIG = {
  APP_NAME: 'emos-uploader',
  CALLBACK_URL: 'https://emos.clun.top/',
  AUTH_BASE_URL: 'https://emos.best/link'
}

/**
 * 保存token到本地存储
 * @param {string} token - 认证token
 * @param {string} refreshToken - 刷新token
 * @param {number} expiry - 过期时间（毫秒）
 */
export const setToken = (token, refreshToken = null, expiry = null) => {
  try {
    sessionStorage.setItem(AUTH_CONSTANTS.TOKEN_KEY, token)
    
    if (refreshToken) {
      sessionStorage.setItem(AUTH_CONSTANTS.REFRESH_TOKEN_KEY, refreshToken)
    }
    
    if (expiry) {
      const expiryTime = Date.now() + expiry
      sessionStorage.setItem(AUTH_CONSTANTS.TOKEN_EXPIRY_KEY, expiryTime.toString())
    }
    
    sessionStorage.setItem(AUTH_CONSTANTS.AUTH_STATUS_KEY, 'true')
    
    logger.success('Token保存成功', {
      hasRefreshToken: !!refreshToken,
      hasExpiry: !!expiry
    })
  } catch (error) {
    logger.error('保存token失败', {
      error: error.message,
      stack: error.stack
    })
  }
}

/**
 * 从本地存储获取token
 * @returns {string|null} - 认证token
 */
export const getToken = () => {
  try {
    const token = sessionStorage.getItem(AUTH_CONSTANTS.TOKEN_KEY)
    
    if (!token) {
      return null
    }
    
    // 验证token是否过期
    if (isTokenExpired()) {
      logger.warn('token已过期')
      removeToken()
      return null
    }
    
    return token
  } catch (error) {
    logger.error('获取token失败', {
      error: error.message,
      stack: error.stack
    })
    return null
  }
}

/**
 * 从本地存储获取刷新token
 * @returns {string|null} - 刷新token
 */
export const getRefreshToken = () => {
  try {
    return sessionStorage.getItem(AUTH_CONSTANTS.REFRESH_TOKEN_KEY)
  } catch (error) {
    logger.error('获取刷新token失败', {
      error: error.message,
      stack: error.stack
    })
    return null
  }
}

/**
 * 检查token是否过期
 * @returns {boolean} - 是否已过期
 */
export const isTokenExpired = () => {
  try {
    const expiry = sessionStorage.getItem(AUTH_CONSTANTS.TOKEN_EXPIRY_KEY)
    
    if (!expiry) {
      return false // 没有设置过期时间，视为未过期
    }
    
    const expiryTime = parseInt(expiry)
    const isExpired = Date.now() > expiryTime
    
    if (isExpired) {
      logger.debug('Token已过期', {
        expiryTime: new Date(expiryTime).toISOString(),
        currentTime: new Date().toISOString()
      })
    }
    
    return isExpired
  } catch (error) {
    logger.error('检查token过期状态失败', {
      error: error.message,
      stack: error.stack
    })
    return false
  }
}

/**
 * 移除本地存储中的token
 */
export const removeToken = () => {
  try {
    sessionStorage.removeItem(AUTH_CONSTANTS.TOKEN_KEY)
    sessionStorage.removeItem(AUTH_CONSTANTS.REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_CONSTANTS.TOKEN_EXPIRY_KEY)
    sessionStorage.removeItem(AUTH_CONSTANTS.AUTH_STATUS_KEY)
    
    logger.info('Token已移除')
  } catch (error) {
    logger.error('移除token失败', {
      error: error.message,
      stack: error.stack
    })
  }
}

/**
 * 检查用户是否已认证
 * @returns {boolean} - 是否已认证
 */
export const isAuthenticated = () => {
  try {
    const token = getToken()
    const authStatus = sessionStorage.getItem(AUTH_CONSTANTS.AUTH_STATUS_KEY)
    const isAuth = !!token && authStatus === 'true'
    
    logger.debug('检查认证状态', {
      isAuthenticated: isAuth,
      hasToken: !!token,
      authStatus
    })
    
    return isAuth
  } catch (error) {
    logger.error('检查认证状态失败', {
      error: error.message,
      stack: error.stack
    })
    return false
  }
}

/**
 * 获取认证状态
 * @returns {Object} - 认证状态信息
 */
export const getAuthStatus = () => {
  try {
    const token = getToken()
    const isAuth = isAuthenticated()
    const isExpired = isTokenExpired()
    
    const authStatus = {
      isAuthenticated: isAuth,
      hasToken: !!token,
      isTokenExpired: isExpired,
      token: token
    }
    
    logger.debug('获取认证状态信息', authStatus)
    
    return authStatus
  } catch (error) {
    logger.error('获取认证状态信息失败', {
      error: error.message,
      stack: error.stack
    })
    return {
      isAuthenticated: false,
      hasToken: false,
      isTokenExpired: false,
      token: null
    }
  }
}

/**
 * 刷新token
 * @returns {Promise<boolean>} - 刷新是否成功
 */
export const refreshToken = async () => {
  try {
    const refreshToken = getRefreshToken()
    
    if (!refreshToken) {
      logger.warn('没有刷新token')
      return false
    }
    
    // 这里应该调用API刷新token
    // 暂时返回false，需要根据实际API实现
    logger.info('尝试刷新token')
    return false
  } catch (error) {
    logger.error('刷新token失败', {
      error: error.message,
      stack: error.stack
    })
    return false
  }
}

/**
 * 生成唯一UUID
 * @returns {string} - 生成的UUID
 */
export const generateUUID = () => {
  try {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    sessionStorage.setItem(AUTH_CONSTANTS.AUTH_UUID_KEY, uuid)
    logger.debug('生成UUID成功', { uuid })
    return uuid
  } catch (error) {
    logger.error('生成UUID失败', {
      error: error.message,
      stack: error.stack
    })
    const fallbackId = Date.now().toString()
    logger.warn('使用时间戳作为UUID的 fallback', { fallbackId })
    return fallbackId
  }
}

/**
 * 保存用户信息到本地存储
 * @param {Object} userInfo - 用户信息对象
 */
export const setUserInfo = (userInfo) => {
  try {
    const { user_id, username, avatar, token } = userInfo
    
    // 保存完整用户信息
    sessionStorage.setItem(AUTH_CONSTANTS.USER_INFO_KEY, JSON.stringify(userInfo))
    
    // 保存单独的用户信息字段
    if (user_id) {
      sessionStorage.setItem(AUTH_CONSTANTS.USER_ID_KEY, user_id)
    }
    if (username) {
      sessionStorage.setItem(AUTH_CONSTANTS.USERNAME_KEY, username)
    }
    if (avatar) {
      sessionStorage.setItem(AUTH_CONSTANTS.AVATAR_KEY, avatar)
    }
    if (token) {
      setToken(token)
    }
    
    logger.success('用户信息保存成功', {
      userId: user_id,
      username: username,
      hasAvatar: !!avatar,
      hasToken: !!token
    })
  } catch (error) {
    logger.error('保存用户信息失败', {
      error: error.message,
      stack: error.stack
    })
  }
}

/**
 * 从本地存储获取用户信息
 * @returns {Object|null} - 用户信息对象
 */
export const getUserInfo = () => {
  try {
    const userInfo = sessionStorage.getItem(AUTH_CONSTANTS.USER_INFO_KEY)
    if (!userInfo) {
      return null
    }
    const parsedUserInfo = JSON.parse(userInfo)
    logger.debug('获取用户信息成功', {
      userId: parsedUserInfo.user_id,
      username: parsedUserInfo.username
    })
    return parsedUserInfo
  } catch (error) {
    logger.error('获取用户信息失败', {
      error: error.message,
      stack: error.stack
    })
    return null
  }
}

/**
 * 构建授权URL
 * @returns {string} - 完整的授权URL
 */
export const buildAuthUrl = () => {
  try {
    const uuid = generateUUID()
    const params = new URLSearchParams({
      uuid: uuid,
      name: APP_CONFIG.APP_NAME,
      url: APP_CONFIG.CALLBACK_URL
    })
    const authUrl = `${APP_CONFIG.AUTH_BASE_URL}?${params.toString()}`
    logger.info('构建授权URL成功', {
      authUrl,
      appName: APP_CONFIG.APP_NAME,
      callbackUrl: APP_CONFIG.CALLBACK_URL,
      uuid
    })
    return authUrl
  } catch (error) {
    logger.error('构建授权URL失败', {
      error: error.message,
      stack: error.stack
    })
    return APP_CONFIG.AUTH_BASE_URL
  }
}

/**
 * 处理授权回调
 * @param {Object} params - 回调参数对象
 * @returns {Object|null} - 处理后的用户信息
 */
export const handleCallback = (params) => {
  try {
    // 验证参数对象是否存在
    if (!params || typeof params !== 'object') {
      logger.error('回调参数格式错误', {
        params: params
      })
      return null
    }
    
    // 获取并验证所有必需参数
    const user_id = params.user_id
    const username = params.username
    const avatar = params.avatar
    const token = params.token
    
    // 验证参数完整性
    if (!user_id || !token) {
      logger.error('回调参数不完整，缺少必需参数', {
        params: {
          hasUserId: !!user_id,
          hasUsername: !!username,
          hasAvatar: !!avatar,
          hasToken: !!token
        }
      })
      return null
    }
    
    // 对参数进行安全性验证，防止恶意数据注入
    const validateParam = (param) => {
      if (typeof param === 'string') {
        // 移除可能的恶意脚本和HTML标签
        return param.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]*>/g, '')
      }
      return param
    }
    
    const userInfo = {
      user_id: validateParam(user_id),
      username: validateParam(username || ''),
      avatar: validateParam(avatar || ''),
      token: validateParam(token)
    }
    
    // 保存用户信息
    setUserInfo(userInfo)
    
    logger.success('回调处理成功', {
      userId: userInfo.user_id,
      username: userInfo.username,
      hasAvatar: !!userInfo.avatar
    })
    return userInfo
  } catch (error) {
    logger.error('处理回调失败', {
      error: error.message,
      stack: error.stack
    })
    return null
  }
}

/**
 * 检查授权状态
 * @returns {boolean} - 是否已授权
 */
export const checkAuthStatus = () => {
  try {
    const userInfo = getUserInfo()
    const token = getToken()
    const isAuth = !!userInfo && !!token
    
    logger.debug('检查授权状态', {
      isAuthorized: isAuth,
      hasUserInfo: !!userInfo,
      hasToken: !!token
    })
    
    return isAuth
  } catch (error) {
    logger.error('检查授权状态失败', {
      error: error.message,
      stack: error.stack
    })
    return false
  }
}

/**
 * 清除所有认证信息
 */
export const clearAuthInfo = () => {
  try {
    sessionStorage.removeItem(AUTH_CONSTANTS.USER_INFO_KEY)
    sessionStorage.removeItem(AUTH_CONSTANTS.USER_ID_KEY)
    sessionStorage.removeItem(AUTH_CONSTANTS.USERNAME_KEY)
    sessionStorage.removeItem(AUTH_CONSTANTS.AVATAR_KEY)
    sessionStorage.removeItem(AUTH_CONSTANTS.AUTH_UUID_KEY)
    sessionStorage.removeItem(AUTH_CONSTANTS.ORIGINAL_URL_KEY)
    sessionStorage.removeItem(AUTH_CONSTANTS.ORIGINAL_URL_EXPIRY_KEY)
    removeToken()
    
    logger.info('认证信息已清除')
  } catch (error) {
    logger.error('清除认证信息失败', {
      error: error.message,
      stack: error.stack
    })
  }
}

/**
 * 保存用户原始访问链接
 * @param {string} url - 原始访问链接
 * @param {number} expiry - 过期时间（毫秒，默认30分钟）
 */
export const saveOriginalUrl = (url, expiry = 30 * 60 * 1000) => {
  try {
    if (!url) {
      return
    }
    
    const expiryTime = Date.now() + expiry
    sessionStorage.setItem(AUTH_CONSTANTS.ORIGINAL_URL_KEY, url)
    sessionStorage.setItem(AUTH_CONSTANTS.ORIGINAL_URL_EXPIRY_KEY, expiryTime.toString())
    
    logger.info('原始链接保存成功', {
      url,
      expiry: expiryTime,
      expiryFormatted: new Date(expiryTime).toISOString()
    })
  } catch (error) {
    logger.error('保存原始链接失败', {
      error: error.message,
      stack: error.stack
    })
  }
}

/**
 * 获取用户原始访问链接
 * @returns {string|null} - 原始访问链接
 */
export const getOriginalUrl = () => {
  try {
    const url = sessionStorage.getItem(AUTH_CONSTANTS.ORIGINAL_URL_KEY)
    const expiry = sessionStorage.getItem(AUTH_CONSTANTS.ORIGINAL_URL_EXPIRY_KEY)
    
    if (!url) {
      return null
    }
    
    // 检查是否过期
    if (expiry) {
      const expiryTime = parseInt(expiry)
      if (Date.now() > expiryTime) {
        logger.warn('原始链接已过期', {
          expiryTime: new Date(expiryTime).toISOString(),
          currentTime: new Date().toISOString()
        })
        clearOriginalUrl()
        return null
      }
    }
    
    logger.debug('获取原始链接成功', { url })
    return url
  } catch (error) {
    logger.error('获取原始链接失败', {
      error: error.message,
      stack: error.stack
    })
    return null
  }
}

/**
 * 清除原始链接
 */
export const clearOriginalUrl = () => {
  try {
    sessionStorage.removeItem(AUTH_CONSTANTS.ORIGINAL_URL_KEY)
    sessionStorage.removeItem(AUTH_CONSTANTS.ORIGINAL_URL_EXPIRY_KEY)
    
    logger.info('原始链接已清除')
  } catch (error) {
    logger.error('清除原始链接失败', {
      error: error.message,
      stack: error.stack
    })
  }
}

/**
 * 处理授权回调并重定向
 * @param {Object} params - 回调参数对象
 * @returns {Object|null} - 处理后的用户信息
 */
export const handleCallbackWithRedirect = (params) => {
  try {
    const userInfo = handleCallback(params)
    
    if (userInfo) {
      // 获取原始链接
      const originalUrl = getOriginalUrl()
      
      if (originalUrl) {
        logger.info('重定向回原始链接', { originalUrl })
        clearOriginalUrl()
        window.location.href = originalUrl
      }
    }
    
    return userInfo
  } catch (error) {
    logger.error('处理回调并重定向失败', {
      error: error.message,
      stack: error.stack
    })
    return null
  }
}

// 导出默认对象
export default {
  setToken,
  getToken,
  getRefreshToken,
  isTokenExpired,
  removeToken,
  isAuthenticated,
  getAuthStatus,
  refreshToken,
  generateUUID,
  setUserInfo,
  getUserInfo,
  buildAuthUrl,
  handleCallback,
  handleCallbackWithRedirect,
  checkAuthStatus,
  clearAuthInfo,
  saveOriginalUrl,
  getOriginalUrl,
  clearOriginalUrl
}
