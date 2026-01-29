import { ref, onMounted, computed } from 'vue'
import { BASE_URL, LOGIN_URL, ERROR_CONFIG } from '../config'
import api from '../utils/api'

export function useAuth() {
  const token = ref('')
  const username = ref('')
  const isLoggedIn = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

  // 计算属性：用户是否已认证
  const isAuthenticated = computed(() => {
    return isLoggedIn.value && token.value !== ''
  })

  // 获取用户信息
  const getUserInfo = () => {
    try {
      const savedToken = sessionStorage.getItem('token')
      const savedUsername = sessionStorage.getItem('username')

      if (savedToken && savedUsername) {
        return { token: savedToken, username: savedUsername }
      }
      return null
    } catch (err) {
      console.error('获取用户信息失败:', err)
      return null
    }
  }

  // 保存用户信息
  const saveUserInfo = (userToken, userName) => {
    try {
      sessionStorage.setItem('token', userToken)
      sessionStorage.setItem('username', userName)
      token.value = userToken
      username.value = userName
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
      token.value = ''
      username.value = ''
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
      const userInfo = getUserInfo()
      if (userInfo) {
        token.value = userInfo.token
        username.value = userInfo.username
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

  // 处理登录回调
  const handleLoginCallback = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const callbackToken = urlParams.get('token')
      const callbackUsername = urlParams.get('username')

      if (callbackToken && callbackUsername) {
        console.log('检测到登录回调，保存用户信息')
        const saved = saveUserInfo(callbackToken, callbackUsername)

        if (saved) {
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
      const callbackUrl = encodeURIComponent(window.location.href)
      const loginUrl = `${BASE_URL}${LOGIN_URL}&url=${callbackUrl}`
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
    isLoggedIn,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    handleLoginCallback,
    validateToken,
    updateUserState
  }
}
