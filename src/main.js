/*
 * @Author: flkGit
 * @Date: 2025-10-16 10:13:30
 * @LastEditors: flkGit
 * @LastEditTime: 2026-02-18 10:00:00
 * @FilePath: /upload-test/src/main.js
 * @Description: 
 * 
 * Copyright (c) 2025 by flkGit, All Rights Reserved. 
 */
import { createApp } from 'vue'
import './assets/style.css'
import App from './App.vue'
import { checkAuthStatus, handleCallbackWithRedirect, buildAuthUrl } from './utils/auth'

// 处理授权回调
const handleAuthCallback = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const user_id = urlParams.get('user_id')
    const username = urlParams.get('username')
    const avatar = urlParams.get('avatar')
    const token = urlParams.get('token')
    
    if (user_id && token) {
      const userInfo = {
        user_id,
        username,
        avatar,
        token
      }
      handleCallbackWithRedirect(userInfo)
      // 清除URL参数，避免刷新页面时重复处理
      window.history.replaceState({}, document.title, window.location.pathname)
      return true
    }
    return false
  } catch (error) {
    console.error('处理授权回调失败:', error)
    return false
  }
}

// 检查授权状态并处理授权流程
const checkAndHandleAuth = () => {
  try {
    // 首先检查是否是回调请求
    const isCallback = handleAuthCallback()
    if (isCallback) {
      console.log('授权回调处理成功')
      return
    }
    
    // 检查是否已授权
    const isAuthorized = checkAuthStatus()
    if (!isAuthorized) {
      console.log('未授权，重定向至授权页面')
      const authUrl = buildAuthUrl()
      window.location.href = authUrl
    } else {
      console.log('已授权，继续加载应用')
    }
  } catch (error) {
    console.error('授权检查失败:', error)
    // 发生错误时，重定向至授权页面
    const authUrl = buildAuthUrl()
    window.location.href = authUrl
  }
}

// 处理授权回调（仅处理回调，不强制登录）
const isCallback = handleAuthCallback()
if (isCallback) {
  console.log('授权回调处理成功')
}

// 创建并挂载应用
createApp(App).mount('#app')
