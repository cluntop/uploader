<template>
  <div>
    <!-- 上传类型选择 -->
    <div v-if="!isUploading && !isSaving && !uploadSummaryInfo && !showResave" class="mb-4">
      <label class="block text-gray-800 font-medium mb-2 text-sm">上传类型</label>
      <div class="flex gap-3">
        <button
          @click="uploadType = 'video'; handleInputModeChange('auto')"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2',
            uploadType === 'video'
              ? 'gradient-theme text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          📹 视频
        </button>
        <button
          @click="uploadType = 'subtitle'; handleInputModeChange('auto')"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2',
            uploadType === 'subtitle'
              ? 'gradient-theme text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          📝 字幕
        </button>
        <button
          @click="uploadType = 'image'; handleInputModeChange('auto')"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2',
            uploadType === 'image'
              ? 'gradient-theme text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          🖼️ 图片
        </button>
      </div>
    </div>
    
    <!-- 视频 ID 输入方式选择 -->
    <div v-if="!isUploading && !isSaving && !uploadSummaryInfo && !showResave" class="mb-4">
      <label class="block text-gray-800 font-medium mb-2 text-sm">视频 ID 输入方式</label>
      <div class="flex gap-3 flex-wrap">
        <button
          @click="uploadType = 'video'; handleInputModeChange('manual')"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
            idInputMode === 'manual'
              ? 'gradient-theme text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          🔢 手动输入
        </button>
        <button
          @click="uploadType = 'video'; handleInputModeChange('auto')"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
            idInputMode === 'auto'
              ? 'gradient-theme text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          🤖 自动识别
        </button>
        <button
          @click="uploadType = 'video'; handleInputModeChange('manual_recognize')"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
            idInputMode === 'manual_recognize'
              ? 'gradient-theme text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          🔍 手动识别
        </button>
      </div>
    </div>
    
    <!-- 上传区域 -->
    <div
      v-if="!isUploading && !isSaving && !uploadSummaryInfo && !showResave"
      :class="[
        'border-2 border-dashed border-teal-500 rounded-lg p-10 text-center transition-all duration-300 bg-teal-50',
        'cursor-pointer hover:border-teal-600 hover:bg-teal-100',
        { 'dragging': isDragging }
      ]"
      @click="handleClick()"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="upload-area">
        <div class="text-5xl mb-2.5">📁</div>
        <div class="text-teal-600 font-medium mb-1">
          点击或拖拽文件到此处选择
        </div>
        <div class="text-gray-500 text-xs">
          {{ getAcceptHint() }}
        </div>
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      :accept="getAcceptType()"
      multiple
      class="hidden"
      @change="handleFileChange"
    />

    <!-- 已选择文件列表 -->
    <div v-if="isLoggedIn && selectedFiles.length > 0 && !uploadSummaryInfo" class="file-list mt-5">
      <div class="font-medium text-gray-800 mb-2 flex justify-between items-center">
        <span>已选择 {{ selectedFiles.length }} 个文件</span>
        <button 
          @click="clearAllFiles"
          class="text-xs text-gray-600 hover:text-gray-800 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          🗑️ 清空所有
        </button>
      </div>
      <div class="space-y-2">
        <div v-for="(file, index) in selectedFiles" :key="index" class="file-item p-3 bg-gray-100 rounded-lg">
          <div class="flex justify-between items-start mb-2">
            <div class="font-medium text-gray-800">
              {{ file.name }}
            </div>
            <div class="flex gap-2">
              <button 
                v-if="idInputMode === 'auto' || idInputMode === 'manual_recognize'" 
                @click="recognizeFile(file)"
                class="text-xs text-gray-600 hover:text-gray-800 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                🔄 重新识别
              </button>
              <button 
                @click="removeFile(index)"
                class="text-xs text-red-600 hover:text-red-800 px-3 py-1 bg-red-50 rounded hover:bg-red-100 transition-colors"
              >
                🗑️ 删除
              </button>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-4 mb-2">
            <div class="text-gray-600 text-sm">
              大小: {{ formatFileSize(file.size) }} | 类型: {{ getUploadTypeLabel() }}
            </div>
            <div v-if="idInputMode === 'auto' || idInputMode === 'manual_recognize'" class="flex flex-wrap items-center gap-2">
              <div v-if="recognitionErrors.get(file.name)" class="text-red-600 font-medium text-sm">
                ❌ 识别失败
              </div>
              <div v-else-if="recognitionResults.get(file.name)" class="flex flex-wrap items-center gap-2">
                <div class="text-green-600 text-sm">
                  视频标题: {{ recognitionResults.get(file.name).title }}
                </div>
                <div class="text-green-600 text-sm">
                  视频 ID: {{ recognitionResults.get(file.name).video_id }}
                </div>
                <div class="text-green-600 text-sm">
                  类型: {{ getRecognitionTypeLabel(recognitionResults.get(file.name)) }}
                </div>
              </div>
              <div v-else class="text-gray-500 text-sm">
                {{ idInputMode === 'auto' ? '待识别' : '待手动识别' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>



    <!-- 进度条（上传过程中显示，保存期间和保存失败时隐藏） -->
    <div v-if="(isUploading || uploadProgress > 0) && !isSaving && !uploadSummaryInfo && !showResave" class="progress-container mt-4">
      <div class="w-full h-2 bg-gray-300 rounded overflow-hidden mb-2.5">
        <div
          class="gradient-theme-h h-full transition-all duration-300"
          :style="{ width: uploadProgress + '%' }"
        ></div>
      </div>
      <div class="flex justify-between text-xs text-gray-600">
        <span>{{ uploadProgress }}%</span>
        <span>{{ uploadSpeed }}</span>
      </div>
    </div>

    <!-- 上传信息面板 -->
    <UploadSummary
      :upload-info="uploadSummaryInfo"
      @continue-upload="$emit('continue-upload')"
    />

    <!-- 上传按钮 -->
    <button
      v-if="isLoggedIn && selectedFiles.length > 0 && !isUploading && uploadProgress === 0 && !uploadSummaryInfo && !showReupload && (idInputMode === 'manual' || Array.from(recognitionResults.values()).length > 0 || selectedFiles.length > 1)"
      @click="handleStartUpload"
      class="mt-4 w-full px-6 py-3 gradient-theme text-white rounded-lg text-sm font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
    >
      开始上传 ({{ selectedFiles.length }} 个文件)
    </button>

    <!-- 重新上传按钮 -->
    <button
      v-if="isLoggedIn && showReupload"
      @click="handleReupload"
      class="reupload-btn mt-4 w-full px-6 py-3 gradient-theme text-white rounded-lg text-sm font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
    >
      🔄 重新上传
    </button>

    <!-- 重新保存按钮 -->
    <button
      v-if="isLoggedIn && showResave"
      @click="handleResave"
      class="resave-btn mt-4 w-full px-6 py-3 bg-orange-500 text-white rounded-lg text-sm font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 hover:bg-orange-600"
    >
      💾 重新保存
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import UploadSummary from './UploadSummary.vue'
import { searchItemId } from '../utils/recognize'
import { isAuthenticated } from '../utils/auth'
import { getUserFriendlyMessage } from '../utils/errorHandler'

const props = defineProps({
  videoId: {
    type: String,
    default: ''
  },
  videoInfo: {
    type: Object,
    default: null
  },
  uploadProgress: {
    type: Number,
    default: 0
  },
  uploadSpeed: {
    type: String,
    default: ''
  },
  isUploading: {
    type: Boolean,
    default: false
  },
  isSaving: {
    type: Boolean,
    default: false
  },
  showReupload: {
    type: Boolean,
    default: false
  },
  showResave: {
    type: Boolean,
    default: false
  },
  uploadToken: {
    type: Object,
    default: null
  },
  uploadSummaryInfo: {
    type: Object,
    default: null
  },
  formatFileSize: {
    type: Function,
    required: true
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['fileSelected', 'startUpload', 'reupload', 'resave', 'continue-upload', 'recognitionComplete'])

const fileInputRef = ref(null)
const selectedFile = ref(null)
const selectedFiles = ref([])
const isDragging = ref(false)
const uploadType = ref('video')
const idInputMode = ref('manual')

// 上传配置 - 移除所有限制
const maxFiles = Infinity // 无文件数量限制
const maxSize = Infinity // 无文件大小限制
const allowedFormats = {
  video: ['*'],
  subtitle: ['*'],
  image: ['*']
}

// 识别相关状态
const isRecognizingMap = ref(new Map()) // 存储每个文件的识别状态
const recognitionProgress = ref(0)
const recognitionStep = ref('')
const recognitionResults = ref(new Map()) // 存储每个文件的识别结果
const recognitionErrors = ref(new Map()) // 存储每个文件的识别错误
const recognitionSteps = ref([])
const showErrorDetails = ref(false)
const recognitionAbortController = ref(null)

// 获取上传类型标签
const getUploadTypeLabel = () => {
  const labels = {
    video: '视频',
    subtitle: '字幕',
    image: '图片'
  }
  return labels[uploadType.value] || '未知'
}

// 获取接受的文件类型 - 移除所有限制
const getAcceptType = () => {
  return '*' // 允许所有文件类型
}

// 获取提示文本 - 移除所有限制
const getAcceptHint = () => {
  return '支持上传任意类型的文件，无大小和数量限制'
}

// 获取识别类型标签
const getRecognitionTypeLabel = (result) => {
  if (!result) return '未知'
  const labels = {
    'vl': '电影',
    've': '电视剧',
    'tv': '电视剧'
  }
  return labels[result.item_type] || result.item_type || '未知'
}

// 验证文件类型 - 移除所有限制
const isValidFile = (file) => {
  return true // 允许所有文件类型
}

// 执行文件识别
const recognizeFile = async (file) => {
  isRecognizingMap.value.set(file.name, true)
  recognitionProgress.value = 0
  recognitionStep.value = '分析文件名...'
  recognitionErrors.value.set(file.name, null)
  recognitionSteps.value = []
  recognitionAbortController.value = new AbortController()

  try {
    // 模拟识别进度
    let progress = 0
    const progressInterval = setInterval(() => {
      if (recognitionAbortController.value.signal.aborted) {
        clearInterval(progressInterval)
        return
      }
      progress += 5
      recognitionProgress.value = progress
      if (progress >= 90) {
        clearInterval(progressInterval)
      }
    }, 200)

    // 执行识别
    recognitionStep.value = '调用识别 API...'
    const result = await searchItemId(file.name, {
      log: (message) => {
        console.log(message)
        if (message.includes('API 识别成功')) {
          recognitionStep.value = 'API 识别成功，处理结果...'
          recognitionSteps.value.push({ name: 'API 识别', status: '成功', message: 'API 识别成功' })
        } else if (message.includes('正则')) {
          recognitionStep.value = '使用正则表达式识别...'
          recognitionSteps.value.push({ name: '正则识别', status: '开始', message: '使用正则表达式识别' })
        } else if (message.includes('搜索')) {
          recognitionStep.value = '搜索视频信息...'
          recognitionSteps.value.push({ name: '视频搜索', status: '开始', message: '搜索视频信息' })
        } else if (message.includes('精准定位')) {
          recognitionStep.value = '精准定位视频...'
          recognitionSteps.value.push({ name: '精准定位', status: '开始', message: '精准定位视频' })

        } else if (message.includes('手动映射命中')) {
          recognitionStep.value = '手动映射命中，直接使用结果...'
          recognitionSteps.value.push({ name: '手动映射', status: '成功', message: '手动映射命中' })
        }
      },
      error: (message) => {
        console.error(message)
      }
    })

    clearInterval(progressInterval)
    recognitionProgress.value = 100
    recognitionStep.value = '识别完成'
    recognitionSteps.value.push({ name: '识别完成', status: '成功', message: '识别成功' })

    recognitionResults.value.set(file.name, result)
    emit('recognitionComplete', result, file.name)

    return result
  } catch (error) {
    console.error('识别失败:', error)
    const errorMessage = getUserFriendlyMessage(error) || '识别失败，请重试'
    recognitionErrors.value.set(file.name, errorMessage)
    recognitionSteps.value.push({ name: '识别失败', status: '失败', message: error.message || '识别失败' })
    return null
  } finally {
    isRecognizingMap.value.set(file.name, false)
    recognitionProgress.value = 100
  }
}

// 取消识别
const cancelRecognition = () => {
  if (recognitionAbortController.value) {
    recognitionAbortController.value.abort()
  }
  // 重置所有文件的识别状态
  isRecognizingMap.value.forEach((_, fileName) => {
    isRecognizingMap.value.set(fileName, false)
  })
  recognitionProgress.value = 0
  recognitionStep.value = ''
  recognitionSteps.value.push({ name: '识别取消', status: '取消', message: '用户取消了识别' })
}

// 重置识别状态
const resetRecognition = (file) => {
  if (file) {
    recognitionResults.value.delete(file.name)
    recognitionErrors.value.delete(file.name)
    isRecognizingMap.value.delete(file.name)
  } else {
    recognitionResults.value.clear()
    recognitionErrors.value.clear()
    isRecognizingMap.value.clear()
  }
  recognitionSteps.value = []
  recognitionAbortController.value = null
  emit('fileSelected', file, uploadType.value, null, idInputMode.value)
}

// 切换输入方式时重置状态
const handleInputModeChange = (mode) => {
  idInputMode.value = mode
  // 重置识别状态，确保切换输入方式时不会保留之前的状态
  recognitionResults.value.clear()
  recognitionErrors.value.clear()
  isRecognizingMap.value.clear()
  recognitionSteps.value = []
  recognitionAbortController.value = null
  // 如果有选中的文件，重新处理
  if (selectedFile.value) {
    processFile(selectedFile.value)
  }
}

// 重试识别
const retryRecognition = async (file) => {
  if (!isAuthenticated() || !props.isLoggedIn) {
    if (file) {
      recognitionErrors.value.set(file.name, '未登录，无法搜索视频，请先登录后再重试')
    }
    return
  }
  
  if (file) {
    await recognizeFile(file)
  }
}

const handleClick = () => {
  if (!props.isUploading) {
    fileInputRef.value?.click()
  }
}

const handleFileChange = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    processFiles(files)
  }
  // 重置 input，允许选择同一个文件
  event.target.value = ''
}

const handleDragOver = () => {
  if (!props.isUploading) {
    isDragging.value = true
  }
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (event) => {
  isDragging.value = false
  if (props.isUploading) return

  const files = Array.from(event.dataTransfer.files)
  if (files.length > 0) {
    processFiles(files)
  }
}

const processFile = async (file) => {
  // 重置识别状态，确保每次选择文件都重新开始识别
  recognitionSteps.value = []
  showErrorDetails.value = false

  selectedFile.value = file

  // 自动识别模式下，立即开始识别
  if (idInputMode.value === 'auto' || idInputMode.value === 'manual_recognize') {
    emit('fileSelected', file, uploadType.value, null, idInputMode.value)
    const result = await recognizeFile(file)
    // 识别完成后，直接使用识别结果进行后续处理
    if (result) {
      emit('recognitionComplete', result, file.name)
    }
  } else {
    // 手动输入模式下，直接通知父组件
    emit('fileSelected', file, uploadType.value, null, idInputMode.value)
  }
}

const processFiles = async (files) => {
  // 重置识别状态
  recognitionSteps.value = []
  showErrorDetails.value = false

  // 添加到已选择文件列表
  selectedFiles.value = [...selectedFiles.value, ...files]

  // 对每个文件执行识别
  for (const file of files) {
    if (idInputMode.value === 'auto' || idInputMode.value === 'manual_recognize') {
      if (files.length === 1) {
        selectedFile.value = file
        emit('fileSelected', file, uploadType.value, null, idInputMode.value)
      }
      await recognizeFile(file)
    } else {
      if (files.length === 1) {
        selectedFile.value = file
        emit('fileSelected', file, uploadType.value, null, idInputMode.value)
      }
    }
  }

  // 通知父组件
  emit('fileSelected', files.length === 1 ? files[0] : files, uploadType.value, null, idInputMode.value)
}

const handleStartUpload = () => {
  if (selectedFiles.value.length > 0) {
    // 验证是否已获取视频信息
    if (!props.videoInfo && idInputMode.value === 'manual') {
      emit('fileSelected', null, null, '请先获取视频信息后再上传！')
      return
    }

    // 对于多个文件，我们可以传递第一个文件的识别结果
    // 或者传递所有文件的识别结果，取决于父组件的期望
    let recognitionResult = null
    if (recognitionResults.value.size > 0) {
      // 获取第一个文件的识别结果
      recognitionResult = recognitionResults.value.values().next().value
    }

    emit('startUpload', selectedFiles.value, uploadType.value, idInputMode.value, recognitionResult)
  }
}

const handleReupload = () => {
  if (selectedFiles.value.length > 0) {
    emit('reupload', selectedFiles.value, uploadType.value)
  }
}

const handleResave = () => {
  emit('resave')
}

// 删除单个文件
const removeFile = (index) => {
  const fileToRemove = selectedFiles.value[index]
  selectedFiles.value.splice(index, 1)
  
  // 从识别状态中移除文件
  if (fileToRemove) {
    recognitionResults.value.delete(fileToRemove.name)
    recognitionErrors.value.delete(fileToRemove.name)
    isRecognizingMap.value.delete(fileToRemove.name)
  }
  
  if (selectedFiles.value.length === 0) {
    selectedFile.value = null
    emit('fileSelected', null, uploadType.value, null, idInputMode.value)
  } else if (selectedFiles.value.length === 1) {
    selectedFile.value = selectedFiles.value[0]
    emit('fileSelected', selectedFiles.value[0], uploadType.value, null, idInputMode.value)
  } else {
    emit('fileSelected', selectedFiles.value, uploadType.value, null, idInputMode.value)
  }
}

// 清空所有文件
const clearAllFiles = () => {
  selectedFiles.value = []
  selectedFile.value = null
  recognitionResults.value.clear()
  recognitionErrors.value.clear()
  isRecognizingMap.value.clear()
  recognitionSteps.value = []
  recognitionAbortController.value = null
  emit('fileSelected', null, uploadType.value, null, idInputMode.value)
}

// 重置文件选择
const resetFile = () => {
  selectedFiles.value = []
  selectedFile.value = null
  recognitionResults.value.clear()
  recognitionErrors.value.clear()
  isRecognizingMap.value.clear()
  recognitionSteps.value = []
  recognitionAbortController.value = null
}

// 手动识别处理函数
const handleManualRecognize = async () => {
  if (!isAuthenticated() || !props.isLoggedIn) {
    if (selectedFile.value) {
      recognitionErrors.value.set(selectedFile.value.name, '未登录，无法搜索视频，请先登录后再重试')
    }
    return
  }
  
  if (!selectedFile.value) {
    if (selectedFile.value) {
      recognitionErrors.value.set(selectedFile.value.name, '请先选择一个文件')
    }
    return
  }
  
  // 调用与自动识别相同的识别逻辑
  await recognizeFile(selectedFile.value)
}

defineExpose({
  selectedFile,
  selectedFiles,
  uploadType,
  idInputMode,
  resetFile,
  removeFile,
  clearAllFiles,
  handleManualRecognize
})
</script>

<style scoped>
.dragging {
  border-color: #0d9488 !important;
  background-color: #ecfdf5 !important;
  box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1) !important;
}
</style>
