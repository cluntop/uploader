<template>
  <div>
    <!-- 上传类型选择 -->
    <div v-if="!isUploading && !isSaving && !uploadSummaryInfo && !showResave" class="mb-4">
      <label class="block text-gray-800 font-medium mb-2 text-sm">上传类型</label>
      <div class="flex gap-3">
        <button
          @click="uploadType = 'video'; idInputMode = 'auto'"
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
          @click="uploadType = 'subtitle'; idInputMode = 'auto'"
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
          @click="uploadType = 'image'; idInputMode = 'auto'"
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
      <div class="flex gap-3">
        <button
          @click="uploadType = 'video'; idInputMode = 'manual'"
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
          @click="uploadType = 'video'; idInputMode = 'auto'"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
            idInputMode === 'auto'
              ? 'gradient-theme text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          🤖 自动识别
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
      <div v-if="isRecognizing" class="recognition-progress">
        <div class="text-3xl mb-2">🔍</div>
        <div class="text-teal-600 font-medium mb-1">
          正在识别文件...
        </div>
        <div class="text-gray-500 text-xs mb-2">
          {{ recognitionStep }}
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5 mb-3">
          <div 
            class="bg-teal-600 h-2.5 rounded-full transition-all duration-300" 
            :style="{ width: recognitionProgress + '%' }"
          ></div>
        </div>
        <div class="flex justify-between text-xs text-gray-500 mb-2">
          <span>{{ recognitionProgress }}%</span>
          <span>{{ recognitionSteps.length > 0 ? recognitionSteps[recognitionSteps.length - 1]?.name : '准备中' }}</span>
        </div>
        <button 
          @click="cancelRecognition"
          class="text-xs text-gray-600 hover:text-gray-800 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          🚫 取消识别
        </button>
      </div>
      <div v-else class="upload-area">
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
      class="hidden"
      @change="handleFileChange"
    />

    <!-- 识别结果 -->
    <div v-if="recognitionResult && !uploadSummaryInfo" class="recognition-result mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div class="flex justify-between items-start">
        <div>
          <div class="font-medium text-green-800 mb-1">
            🎯 识别成功
          </div>
          <div class="text-green-600 text-sm">
            视频标题: {{ recognitionResult.title }}
          </div>
          <div class="text-green-600 text-sm">
            视频 ID: {{ recognitionResult.video_id }}
          </div>
          <div class="text-green-600 text-sm">
            类型: {{ getRecognitionTypeLabel() }}
          </div>
        </div>
        <button 
          v-if="recognitionResult" 
          @click="resetRecognition"
          class="text-sm text-gray-500 hover:text-gray-700"
        >
          🔄 重新识别
        </button>
      </div>
    </div>

    <!-- 识别错误 -->
    <div v-if="recognitionError && !uploadSummaryInfo" class="recognition-error mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div class="font-medium text-red-800 mb-1">
        ❌ 识别失败
      </div>
      <div class="text-red-600 text-sm mb-2">
        {{ typeof recognitionError === 'string' ? recognitionError : recognitionError.message || '识别失败，请重试' }}
      </div>
      <div class="flex gap-2 mb-2">
        <button 
          @click="retryRecognition"
          class="text-sm text-red-700 hover:text-red-900 px-3 py-1 bg-red-100 rounded hover:bg-red-200 transition-colors"
        >
          🔄 重试
        </button>
        <button 
          @click="showErrorDetails = !showErrorDetails"
          class="text-sm text-red-700 hover:text-red-900 px-3 py-1 bg-red-100 rounded hover:bg-red-200 transition-colors"
        >
          {{ showErrorDetails ? '收起详情' : '查看详情' }}
        </button>
      </div>
      <div v-if="showErrorDetails" class="mt-2 p-3 bg-red-100 rounded-lg text-xs text-red-700 overflow-auto max-h-40">
        <div v-if="typeof recognitionError === 'object' && recognitionError.steps" class="mb-2">
          <div class="font-medium mb-1">识别步骤详情：</div>
          <div v-for="(step, index) in recognitionError.steps" :key="index" class="mb-1">
            <div class="font-medium">{{ step.name }}</div>
            <div class="ml-2">{{ step.status }} - {{ step.message }}</div>
          </div>
        </div>
        <div v-else-if="typeof recognitionError === 'object'" class="pre-wrap">
          {{ JSON.stringify(recognitionError, null, 2) }}
        </div>
        <div v-else class="pre-wrap">
          {{ recognitionError }}
        </div>
      </div>
    </div>

    <!-- 文件信息（上传和保存过程中都显示） -->
    <div v-if="isLoggedIn && selectedFile && !uploadSummaryInfo" class="file-info mt-5 p-4 bg-gray-100 rounded-lg">
      <div class="font-medium text-gray-800 mb-1">
        文件名: {{ selectedFile.name }}
      </div>
      <div class="text-gray-600 text-sm mb-2">
        大小: {{ formatFileSize(selectedFile.size) }} | 类型: {{ getUploadTypeLabel() }}
        <span v-if="idInputMode === 'auto'" class="ml-2">
          <span v-if="recognitionResult" class="text-green-600 font-medium">
            🎯 已识别: {{ recognitionResult.title }}
            <span class="ml-1 text-xs bg-green-100 px-2 py-0.5 rounded-full text-green-700">
              {{ getRecognitionTypeLabel() }}
            </span>
          </span>
          <span v-else-if="recognitionError" class="text-red-600 font-medium">
            ❌ 识别失败
          </span>
          <span v-else-if="isRecognizing" class="text-blue-600 font-medium">
            🔍 识别中... {{ recognitionStep }}
          </span>
          <span v-else class="text-gray-500">
            待识别
          </span>
        </span>
      </div>
      <div class="text-gray-600 text-sm" v-if="videoId">
        视频ID: {{ videoId }}
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
      v-if="isLoggedIn && selectedFile && !isUploading && uploadProgress === 0 && !uploadSummaryInfo && !showReupload && !isRecognizing && (idInputMode === 'manual' || recognitionResult)"
      @click="handleStartUpload"
      class="mt-4 w-full px-6 py-3 gradient-theme text-white rounded-lg text-sm font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
    >
      开始上传
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
const isDragging = ref(false)
const uploadType = ref('video')
const idInputMode = ref('manual')

// 识别相关状态
const isRecognizing = ref(false)
const recognitionProgress = ref(0)
const recognitionStep = ref('')
const recognitionResult = ref(null)
const recognitionError = ref(null)
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

// 获取接受的文件类型
const getAcceptType = () => {
  const types = {
    video: 'video/*',
    subtitle: '.srt,.ass,.ssa,.vtt',
    image: 'image/*'
  }
  return types[uploadType.value] || '*'
}

// 获取提示文本
const getAcceptHint = () => {
  const hints = {
    video: '仅支持视频文件 (MP4, AVI, MOV, MKV 等)',
    subtitle: '支持字幕文件 (SRT, ASS, SSA, VTT)',
    image: '支持图片文件 (JPG, PNG, WEBP, GIF, BMP 等)'
  }
  return hints[uploadType.value] || '请选择文件'
}

// 获取识别类型标签
const getRecognitionTypeLabel = () => {
  if (!recognitionResult.value) return '未知'
  const labels = {
    'vl': '电影',
    've': '电视剧',
    'tv': '电视剧'
  }
  return labels[recognitionResult.value.item_type] || recognitionResult.value.item_type || '未知'
}

// 验证文件类型
const isValidFile = (file) => {
  if (uploadType.value === 'video') {
    const fileName = file.name.toLowerCase()

    // 明确排除 .ts 文件（TypeScript 或 Transport Stream）
    if (fileName.endsWith('.ts')) {
      return false
    }

    // 检查 MIME 类型
    if (file.type.startsWith('video/')) {
      return true
    }

    // 检查文件扩展名
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg', '.3gp', '.ts']
    return videoExtensions.some(ext => fileName.endsWith(ext))
  }

  if (uploadType.value === 'subtitle') {
    const subtitleExtensions = ['.srt', '.ass', '.ssa', '.vtt']
    const fileName = file.name.toLowerCase()
    return subtitleExtensions.some(ext => fileName.endsWith(ext))
  }

  if (uploadType.value === 'image') {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    const fileName = file.name.toLowerCase()
    if (file.type.startsWith('image/')) {
      return true
    }
    return imageExtensions.some(ext => fileName.endsWith(ext))
  }

  return false
}

// 执行文件识别
const recognizeFile = async (file) => {
  isRecognizing.value = true
  recognitionProgress.value = 0
  recognitionStep.value = '分析文件名...'
  recognitionError.value = null
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

    recognitionResult.value = result
    emit('recognitionComplete', result)

    return result
  } catch (error) {
    console.error('识别失败:', error)
    recognitionError.value = error.message || '识别失败，请重试'
    recognitionSteps.value.push({ name: '识别失败', status: '失败', message: error.message || '识别失败' })
    return null
  } finally {
    isRecognizing.value = false
    recognitionProgress.value = 100
  }
}

// 取消识别
const cancelRecognition = () => {
  if (recognitionAbortController.value) {
    recognitionAbortController.value.abort()
  }
  isRecognizing.value = false
  recognitionProgress.value = 0
  recognitionStep.value = ''
  recognitionError.value = '识别已取消'
  recognitionSteps.value.push({ name: '识别取消', status: '取消', message: '用户取消了识别' })
}

// 重置识别状态
const resetRecognition = () => {
  recognitionResult.value = null
  recognitionError.value = null
  recognitionSteps.value = []
  recognitionAbortController.value = null
  selectedFile.value = null
  emit('fileSelected', null, uploadType.value, null, idInputMode.value)
}

// 重试识别
const retryRecognition = async () => {
  if (selectedFile.value) {
    await recognizeFile(selectedFile.value)
  }
}

const handleClick = () => {
  if (!props.isUploading && !isRecognizing.value) {
    fileInputRef.value?.click()
  }
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
  // 重置 input，允许选择同一个文件
  event.target.value = ''
}

const handleDragOver = () => {
  if (!props.isUploading && !isRecognizing.value) {
    isDragging.value = true
  }
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (event) => {
  isDragging.value = false
  if (props.isUploading || isRecognizing.value) return

  const file = event.dataTransfer.files[0]
  if (file) {
    processFile(file)
  }
}

const processFile = async (file) => {
  if (!isValidFile(file)) {
    const typeLabel = getUploadTypeLabel()
    emit('fileSelected', null, null, `错误：只能上传${typeLabel}文件！`)
    return
  }

  selectedFile.value = file

  // 自动识别模式下，立即开始识别
  if (idInputMode.value === 'auto') {
    emit('fileSelected', file, uploadType.value, null, idInputMode.value)
    await recognizeFile(file)
  } else {
    // 手动模式下，直接通知父组件
    emit('fileSelected', file, uploadType.value, null, idInputMode.value)
  }
}

const handleStartUpload = () => {
  if (selectedFile.value) {
    // 验证是否已获取视频信息
    if (!props.videoInfo && idInputMode.value === 'manual') {
      emit('fileSelected', null, null, '请先获取视频信息后再上传！')
      return
    }

    emit('startUpload', selectedFile.value, uploadType.value, idInputMode.value, recognitionResult.value)
  }
}

const handleReupload = () => {
  if (selectedFile.value) {
    emit('reupload', selectedFile.value, uploadType.value)
  }
}

const handleResave = () => {
  emit('resave')
}

// 重置文件选择
const resetFile = () => {
  selectedFile.value = null
  recognitionResult.value = null
  recognitionError.value = null
  recognitionSteps.value = []
  recognitionAbortController.value = null
}

defineExpose({
  selectedFile,
  uploadType,
  idInputMode,
  resetFile
})
</script>
