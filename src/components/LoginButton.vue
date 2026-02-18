<template>
  <div class="login-button-container">
    <button
      v-if="!isLoggedIn"
      @click="handleLogin"
      :disabled="isLoading"
    >
      <div class="svg-wrapper-1">
        <div class="svg-wrapper">
          <svg
            xmlns=" `http://www.w3.org/2000/svg` "
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path fill="none" d="M0 0h24v24H0z"></path>
            <path
              fill="currentColor"
              d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
            ></path>
          </svg>
        </div>
      </div>
      <span>{{ isLoading ? '跳转中...' : '登录' }}</span>
    </button>
    <div v-else class="user-info">
      <span class="username">{{ username || '用户' }}</span>
      <button @click="handleLogout">
        <div class="svg-wrapper-1">
          <div class="svg-wrapper">
            <svg
              xmlns=" `http://www.w3.org/2000/svg` "
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path fill="none" d="M0 0h24v24H0z"></path>
              <path
                fill="currentColor"
                d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
              ></path>
            </svg>
          </div>
        </div>
        <span>登出</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'

const {
  isLoggedIn,
  username,
  avatar,
  isLoading,
  login,
  logout,
  updateUserState
} = useAuth()

const handleLogin = () => {
  login()
}

const handleLogout = () => {
  logout()
  // 刷新页面以更新状态
  window.location.reload()
}

onMounted(() => {
  updateUserState()
})
</script>

<style scoped>
.login-button-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

button {
  font-family: inherit;
  font-size: 14px;
  background: royalblue;
  color: white;
  padding: 0.5em 0.8em;
  padding-left: 0.7em;
  display: flex;
  align-items: center;
  border: none;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  cursor: pointer;
  white-space: nowrap;
}

button span {
  display: block;
  margin-left: 0.3em;
  transition: all 0.3s ease-in-out;
}

button svg {
  display: block;
  transform-origin: center center;
  transition: transform 0.3s ease-in-out;
}

button:hover .svg-wrapper {
  animation: fly-1 0.6s ease-in-out infinite alternate;
}

button:hover svg {
  transform: translateX(1.2em) rotate(45deg) scale(1.1);
}

button:hover span {
  transform: translateX(5em);
}

button:active {
  transform: scale(0.95);
}

button:disabled {
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
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fly-1 {
  from {
    transform: translateY(0.1em);
  }

  to {
    transform: translateY(-0.1em);
  }
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



.username {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}
</style>
