/* 
 * @Author: flkGit
 * @Date: 2026-02-18 10:00:00
 * @LastEditors: flkGit
 * @LastEditTime: 2026-02-18 10:00:00
 * @FilePath: /emos-uploader/src/utils/auth.js
 * @Description: 统一认证管理模块
 *
 * Copyright (c) 2026 by flkGit, All Rights Reserved.
 */

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
  CALLBACK_URL: 'https://emos-link.local/',
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
    
    console.log('Token保存成功')
  } catch (error) {
    console.error('保存token失败:', error)
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
    
    // 验证token格式
    if (!token.startsWith('eyJ')) {
      console.warn('无效的token格式')
      removeToken()
      return null
    }
    
    // 验证token是否过期
    if (isTokenExpired()) {
      console.warn('token已过期')
      removeToken()
      return null
    }
    
    return token
  } catch (error) {
    console.error('获取token失败:', error)
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
    console.error('获取刷新token失败:', error)
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
    return Date.now() > expiryTime
  } catch (error) {
    console.error('检查token过期状态失败:', error)
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
    
    console.log('Token已移除')
  } catch (error) {
    console.error('移除token失败:', error)
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
    
    return !!token && authStatus === 'true'
  } catch (error) {
    console.error('检查认证状态失败:', error)
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
    
    return {
      isAuthenticated: isAuth,
      hasToken: !!token,
      isTokenExpired: isExpired,
      token: token
    }
  } catch (error) {
    console.error('获取认证状态信息失败:', error)
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
      console.warn('没有刷新token')
      return false
    }
    
    // 这里应该调用API刷新token
    // 暂时返回false，需要根据实际API实现
    console.log('尝试刷新token')
    return false
  } catch (error) {
    console.error('刷新token失败:', error)
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
    return uuid
  } catch (error) {
    console.error('生成UUID失败:', error)
    return Date.now().toString()
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
    
    console.log('用户信息保存成功:', userInfo)
  } catch (error) {
    console.error('保存用户信息失败:', error)
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
    return JSON.parse(userInfo)
  } catch (error) {
    console.error('获取用户信息失败:', error)
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
    console.log('构建授权URL:', authUrl)
    return authUrl
  } catch (error) {
    console.error('构建授权URL失败:', error)
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
    const { user_id, username, avatar, token } = params
    
    // 验证参数完整性
    if (!user_id || !token) {
      console.error('回调参数不完整:', params)
      return null
    }
    
    const userInfo = {
      user_id,
      username: username || '',
      avatar: avatar || '',
      token
    }
    
    // 保存用户信息
    setUserInfo(userInfo)
    
    console.log('回调处理成功:', userInfo)
    return userInfo
  } catch (error) {
    console.error('处理回调失败:', error)
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
    return !!userInfo && !!token
  } catch (error) {
    console.error('检查授权状态失败:', error)
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
    
    console.log('认证信息已清除')
  } catch (error) {
    console.error('清除认证信息失败:', error)
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
    
    console.log('原始链接保存成功:', url)
  } catch (error) {
    console.error('保存原始链接失败:', error)
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
        console.warn('原始链接已过期')
        clearOriginalUrl()
        return null
      }
    }
    
    return url
  } catch (error) {
    console.error('获取原始链接失败:', error)
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
    
    console.log('原始链接已清除')
  } catch (error) {
    console.error('清除原始链接失败:', error)
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
        console.log('重定向回原始链接:', originalUrl)
        clearOriginalUrl()
        window.location.href = originalUrl
      }
    }
    
    return userInfo
  } catch (error) {
    console.error('处理回调并重定向失败:', error)
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
