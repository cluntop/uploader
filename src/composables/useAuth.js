import { ref, onMounted, computed } from 'vue'
import { BASE_URL, ERROR_CONFIG } from '../config'
import api from '../utils/api'
import { setToken, getToken, isAuthenticated as isAuthAuthenticated, getUserInfo as getAuthUserInfo, clearAuthInfo, checkAuthStatus as authCheckAuthStatus } from '../utils/auth'

export function useAuth() {
  const token = ref('')
  const username = ref('')
  const userId = ref('')
  const avatar = ref('')
  const isLoggedIn = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

  // 计算属性：用户是否已认证
  const isAuthenticated = computed(() => {
    return isAuthAuthenticated()
  })

  // 生成唯一 UUID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // 获取用户信息
  const getUserInfo = () => {
    try {
      const userInfo = getAuthUserInfo()
      if (userInfo) {
        return userInfo
      }
      
      // 后备方案：从 sessionStorage 直接获取
      const savedToken = sessionStorage.getItem('token')
      const savedUsername = sessionStorage.getItem('username')
      const savedUserId = sessionStorage.getItem('user_id')
      const savedAvatar = sessionStorage.getItem('avatar')

      if (savedToken && savedUsername && savedUserId) {
        return {
          token: savedToken,
          username: savedUsername,
          user_id: savedUserId,
          avatar: savedAvatar
        }
      }
      return null
    } catch (err) {
      console.error('获取用户信息失败:', err)
      return null
    }
  }

  // 保存用户信息
  const saveUserInfo = (userToken, userName, userId, userAvatar) => {
    try {
      // 使用 auth.js 中的 setToken 函数保存 token
      setToken(userToken)
      
      // 保存其他用户信息
      sessionStorage.setItem('username', userName)
      sessionStorage.setItem('user_id', userId)
      sessionStorage.setItem('avatar', userAvatar || '')
      
      // 更新响应式状态
      token.value = userToken
      username.value = userName
      userId.value = userId
      avatar.value = userAvatar || ''
      isLoggedIn.value = true
      error.value = null
      return true
    } catch (err) {
      console.error('保存用户信息失败:', err)
      error.value = '保存用户信息失败'
      return false
    }
  }

  // 清除用户信息
  const clearUserInfo = () => {
    try {
      // 使用 auth.js 中的 clearAuthInfo 函数清除所有认证信息
      clearAuthInfo()
      
      // 更新响应式状态
      token.value = ''
      username.value = ''
      userId.value = ''
      avatar.value = ''
      isLoggedIn.value = false
      error.value = null
      // 清除 API 缓存
      api.clearCache()
    } catch (err) {
      console.error('清除用户信息失败:', err)
      error.value = '清除用户信息失败'
    }
  }

  // 更新用户状态
  const updateUserState = () => {
    try {
      // 直接使用 auth.js 中的 getAuthUserInfo 函数
      const userInfo = getAuthUserInfo()
      if (userInfo) {
        token.value = userInfo.token || sessionStorage.getItem('token')
        username.value = userInfo.username || sessionStorage.getItem('username')
        userId.value = userInfo.user_id || sessionStorage.getItem('user_id')
        avatar.value = userInfo.avatar || sessionStorage.getItem('avatar')
        isLoggedIn.value = true
        error.value = null
        console.log('用户已登录:', userInfo)
      } else {
        // 检查是否有 token 但没有完整用户信息
        const tokenFromStorage = sessionStorage.getItem('token')
        if (tokenFromStorage) {
          token.value = tokenFromStorage
          username.value = sessionStorage.getItem('username') || '用户'
          userId.value = sessionStorage.getItem('user_id') || ''
          avatar.value = sessionStorage.getItem('avatar') || ''
          isLoggedIn.value = true
          error.value = null
          console.log('用户已登录（仅token）')
        } else {
          console.log('用户未登录')
        }
      }
    } catch (err) {
      console.error('更新用户状态失败:', err)
      error.value = '更新用户状态失败'
    }
  }

  // 保存用户原始访问链接
  const saveOriginalUrl = (url, expiry = 30 * 60 * 1000) => {
    try {
      if (!url) {
        return
      }
      const expiryTime = Date.now() + expiry
      sessionStorage.setItem('original_url', url)
      sessionStorage.setItem('original_url_expiry', expiryTime.toString())
      console.log('原始链接保存成功:', url)
    } catch (error) {
      console.error('保存原始链接失败:', error)
    }
  }

  // 获取用户原始访问链接
  const getOriginalUrl = () => {
    try {
      const url = sessionStorage.getItem('original_url')
      const expiry = sessionStorage.getItem('original_url_expiry')
      if (!url) {
        return null
      }
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

  // 清除原始链接
  const clearOriginalUrl = () => {
    try {
      sessionStorage.removeItem('original_url')
      sessionStorage.removeItem('original_url_expiry')
      console.log('原始链接已清除')
    } catch (error) {
      console.error('清除原始链接失败:', error)
    }
  }

  // 处理登录回调
  const handleLoginCallback = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const callbackToken = urlParams.get('token')
      const callbackUsername = urlParams.get('username')
      const callbackUserId = urlParams.get('user_id')
      const callbackAvatar = urlParams.get('avatar')
      const errorParam = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')

      // 处理登录错误
      if (errorParam) {
        console.error('登录回调错误:', errorParam, errorDescription)
        switch (errorParam) {
          case 'network_error':
            error.value = '网络连接失败，请检查网络设置后重试'
            break
          case 'invalid_credentials':
            error.value = '账号或密码错误，请重新输入'
            break
          case 'session_expired':
            error.value = '会话已过期，请重新登录'
            break
          case 'permission_denied':
            error.value = '权限不足，无法登录'
            break
          default:
            error.value = errorDescription || '登录失败，请重试'
        }
        // 清除 URL 中的参数
        const cleanUrl = window.location.origin + window.location.pathname
        window.history.replaceState({}, document.title, cleanUrl)
        return false
      }

      if (callbackToken && callbackUserId) {
        console.log('检测到登录回调，保存用户信息')
        const saved = saveUserInfo(callbackToken, callbackUsername, callbackUserId, callbackAvatar)

        if (saved) {
          // 获取原始链接并尝试重定向
          const originalUrl = getOriginalUrl()
          if (originalUrl) {
            console.log('重定向回原始链接:', originalUrl)
            clearOriginalUrl()
            // 清除 URL 中的参数
            const cleanUrl = window.location.origin + window.location.pathname
            window.history.replaceState({}, document.title, cleanUrl)
            window.location.href = originalUrl
            return true
          }
          // 清除 URL 中的参数
          const cleanUrl = window.location.origin + window.location.pathname
          window.history.replaceState({}, document.title, cleanUrl)
          return true
        } else {
          error.value = '保存用户信息失败'
          return false
        }
      } else {
        console.log('登录回调参数不完整')
        error.value = '登录回调参数不完整'
        return false
      }
    } catch (err) {
      console.error('处理登录回调失败:', err)
      if (err.name === 'TypeError') {
        error.value = 'URL 参数解析失败'
      } else if (err.name === 'SecurityError') {
        error.value = '安全错误，无法处理登录回调'
      } else {
        error.value = '处理登录回调失败'
      }
      return false
    }
  }

  // 登录
  const login = () => {
    try {
      // 保存当前页面作为原始链接
      const currentUrl = window.location.href
      saveOriginalUrl(currentUrl)
      
      const uuid = generateUUID()
      const name = 'emos-upload'
      const callbackUrl = encodeURIComponent(window.location.origin + window.location.pathname)
      const loginUrl = `https://emos.best/link?uuid=${uuid}&name=${encodeURIComponent(name)}&url=${callbackUrl}`
      console.log('跳转到登录页面:', loginUrl)
      window.location.href = loginUrl
    } catch (err) {
      console.error('登录失败:', err)
      if (err.name === 'TypeError') {
        error.value = '生成登录链接失败'
      } else if (err.name === 'SecurityError') {
        error.value = '安全错误，无法执行登录操作'
      } else {
        error.value = '登录失败，请重试'
      }
    }
  }

  // 登出
  const logout = () => {
    try {
      console.log('用户登出')
      clearUserInfo()
    } catch (err) {
      console.error('登出失败:', err)
      if (err.name === 'TypeError') {
        error.value = '清除用户信息失败'
      } else if (err.name === 'SecurityError') {
        error.value = '安全错误，无法执行登出操作'
      } else {
        error.value = '登出失败，请重试'
      }
    }
  }

  // 验证令牌有效性
  const validateToken = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      // 这里可以添加一个验证令牌的 API 调用
      // 例如：await api.get('/api/auth/validate')
      
      // 暂时返回 true，假设令牌有效
      return true
    } catch (err) {
      console.error('验证令牌失败:', err)
      if (err.name === 'NetworkError' || err.message.includes('网络')) {
        error.value = '网络连接失败，无法验证令牌'
      } else if (err.name === 'UnauthorizedError' || err.message.includes('未授权')) {
        error.value = '令牌无效或已过期，请重新登录'
      } else if (err.name === 'ForbiddenError' || err.message.includes('权限')) {
        error.value = '权限不足，无法验证令牌'
      } else {
        error.value = '验证令牌失败，请重新登录'
      }
      // 令牌无效，清除用户信息
      clearUserInfo()
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 初始化
  onMounted(async () => {
    try {
      handleLoginCallback()
      updateUserState()
      
      // 如果已登录，验证令牌有效性
      if (isLoggedIn.value) {
        await validateToken()
      }
    } catch (err) {
      console.error('初始化认证状态失败:', err)
      error.value = '初始化认证状态失败'
    }
  })

  return {
    token,
    username,
    userId,
    avatar,
    isLoggedIn,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    handleLoginCallback,
    validateToken,
    updateUserState,
    checkAuthStatus: authCheckAuthStatus,
    saveOriginalUrl,
    getOriginalUrl,
    clearOriginalUrl
  }
}
