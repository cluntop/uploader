import { ref, onMounted, computed } from 'vue'
import { BASE_URL, ERROR_CONFIG } from '../config'
import api from '../utils/api'

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
    return isLoggedIn.value && token.value !== ''
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
      sessionStorage.setItem('token', userToken)
      sessionStorage.setItem('username', userName)
      sessionStorage.setItem('user_id', userId)
      sessionStorage.setItem('avatar', userAvatar || '')
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
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('username')
      sessionStorage.removeItem('user_id')
      sessionStorage.removeItem('avatar')
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

  // 检查认证状态
  const checkAuthStatus = () => {
    try {
      const userInfo = getUserInfo()
      const token = sessionStorage.getItem('token')
      return !!userInfo && !!token
    } catch (error) {
      console.error('检查授权状态失败:', error)
      return false
    }
  }

  // 更新用户状态
  const updateUserState = () => {
    try {
      const userInfo = getUserInfo()
      if (userInfo) {
        token.value = userInfo.token
        username.value = userInfo.username
        userId.value = userInfo.user_id
        avatar.value = userInfo.avatar
        isLoggedIn.value = true
        error.value = null
        console.log('用户已登录:', userInfo)
      } else {
        console.log('用户未登录')
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
        }
      }
      return false
    } catch (err) {
      console.error('处理登录回调失败:', err)
      error.value = '处理登录回调失败'
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
      error.value = ERROR_CONFIG.ERROR_MESSAGES.AUTH_ERROR
    }
  }

  // 登出
  const logout = () => {
    try {
      console.log('用户登出')
      clearUserInfo()
    } catch (err) {
      console.error('登出失败:', err)
      error.value = '登出失败'
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
      error.value = ERROR_CONFIG.ERROR_MESSAGES.AUTH_ERROR
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
    checkAuthStatus,
    saveOriginalUrl,
    getOriginalUrl,
    clearOriginalUrl
  }
}
