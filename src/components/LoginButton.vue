<template>
  <div class="login-button-container">
    <button
      v-if="!isUserAuthenticated"
      @click="handleLogin"
      class="login-button"
      :disabled="isLoading"
    >
      <span v-if="isLoading" class="loading-spinner"></span>
      <span>{{ isLoading ? '跳转中...' : '登录' }}</span>
    </button>
    <div v-else class="user-info">
      <img v-if="userInfo?.avatar" :src="userInfo.avatar" alt="用户头像" class="user-avatar" />
      <span class="username">{{ userInfo?.username || '用户' }}</span>
      <button @click="handleLogout" class="logout-button">退出</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { isAuthenticated, buildAuthUrl, getUserInfo, clearAuthInfo, saveOriginalUrl } from '../utils/auth'

const isLoading = ref(false)
const userInfo = ref(null)

const isUserAuthenticated = computed(() => {
  return isAuthenticated()
})

const handleLogin = async () => {
  try {
    isLoading.value = true
    // 保存用户当前的访问链接
    const currentUrl = window.location.href
    saveOriginalUrl(currentUrl)
    const authUrl = buildAuthUrl()
    window.location.href = authUrl
  } catch (error) {
    console.error('登录失败:', error)
    isLoading.value = false
  }
}

const handleLogout = () => {
  try {
    clearAuthInfo()
    window.location.reload()
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

const loadUserInfo = () => {
  try {
    userInfo.value = getUserInfo()
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.login-button-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.login-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.logout-button {
  padding: 4px 8px;
  background: #f1f5f9;
  color: #64748b;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background: #e2e8f0;
  color: #334155;
}
</style>
