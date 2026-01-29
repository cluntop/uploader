# EMOS 视频上传服务

EMOS emby 公益服视频上传服务 - 基于 Vue 3 + Vite + Tailwind CSS 的视频上传应用。

## 功能特性

- ✅ 用户认证（第三方登录）
- ✅ 视频 ID 验证和信息获取
- ✅ 文件拖拽上传
- ✅ 智能分片上传（自动选择上传策略）
- ✅ 断点续传（上传失败后可从断点继续）
- ✅ 实时进度和速度显示
- ✅ 响应式设计

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

访问 `http://localhost:8000`

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 项目结构

```
emos-uploader/
├── public/                     # 静态资源
│   ├── favicon.svg                # 网站图标
│   ├── favicon.ico
│   └── index-old.html             # 原始单文件版本（已弃用）
├── src/
│   ├── assets/                 # 资源文件（CSS、图片等）
│   │   └── style.css              # 全局样式和 Tailwind 配置
│   ├── components/             # Vue 组件
│   │   ├── StatusMessage.vue      # 顶部通知消息组件
│   │   ├── UserPanel.vue          # 用户认证面板组件
│   │   ├── VideoInfo.vue          # 视频信息组件
│   │   └── FileUpload.vue         # 文件上传组件
│   ├── composables/            # 逻辑复用
│   │   ├── useAuth.js             # 用户认证逻辑
│   │   ├── useVideoInfo.js        # 视频信息获取逻辑
│   │   ├── useUpload.js           # 文件上传逻辑
│   │   ├── useUploadToken.js      # 上传令牌获取逻辑
│   │   └── useNotification.js     # 通知消息逻辑
│   ├── App.vue                 # 根组件
│   ├── main.js                 # 应用入口
│   └── config.js               # 配置文件
├── index.html                  # HTML 入口
├── vite.config.js              # Vite 配置
├── tailwind.config.js          # Tailwind CSS 配置
├── postcss.config.js           # PostCSS 配置
├── package.json                # 项目依赖
├── CLAUDE.md                   # 详细技术文档
└── README.md                   # 项目说明
```

## 技术栈

- Vue 3 (Composition API) - ^3.5.22
- Vite - ^6.4.0
- Tailwind CSS - ^3.4.18
- PostCSS - ^8.5.6

## 配置

在 `src/config.js` 中修改 API 端点。

## Docker 支持

### 使用 docker-compose 构建并运行（推荐）

使用 docker-compose 可以一步完成构建和部署，无需手动执行 docker build 命令：

```bash
docker-compose up -d
```

### 手动构建和运行（可选）

如果需要手动构建和运行，可以使用以下命令：

```bash
# 构建 Docker 镜像
docker build -t emos-uploader .

# 运行 Docker 容器
docker run -d --name emos-uploader -p 8000:3000 --restart unless-stopped emos-uploader
```

### 环境变量配置

在 `.env.production` 文件中配置环境变量：

```env
# API 端点配置
VITE_API_BASE_URL=https://your-api-endpoint.com

# 其他配置...
```

### 访问服务

构建并运行容器后，可通过以下地址访问服务：

```
http://localhost:8000
```

### 停止和移除容器

```bash
# 停止容器
docker-compose down

# 或使用 docker 命令
docker stop emos-uploader
docker rm emos-uploader
```

## Cloudflare Tunnel 配置

由于使用 Cloudflare Tunnel，您可以参考以下步骤进行配置：

1. 安装 Cloudflare Tunnel 客户端：

```bash
# Windows
choco install cloudflared

# Linux
sudo apt-get install cloudflared

# macOS
brew install cloudflared
```

2. 登录 Cloudflare Tunnel：

```bash
cloudflared tunnel login
```

3. 创建 Tunnel：

```bash
cloudflared tunnel create emos-uploader
```

4. 配置 Tunnel：

创建一个 `config.yml` 文件：

```yaml
url: http://localhost:8000
# 其他配置...
```

5. 运行 Tunnel：

```bash
cloudflared tunnel run emos-uploader
```

6. 将 Tunnel 与域名关联：

参考 Cloudflare 文档，将您的域名与 Tunnel 关联。

## API 优化

### 优化内容

1. **全局 API 请求封装**：
   - 统一错误处理
   - 自动重试机制
   - 响应缓存
   - 请求头管理

2. **配置优化**：
   - 集中管理 API 端点
   - 可配置的超时设置
   - 可配置的缓存策略
   - 可配置的重试策略

3. **错误处理优化**：
   - 详细的错误消息
   - 统一的错误处理逻辑
   - 错误消息国际化

4. **性能优化**：
   - 分片上传优化
   - 断点续传
   - 内存管理
   - 上传速度计算

5. **安全性优化**：
   - 认证令牌管理
   - 安全的 API 调用

### 使用方法

#### API 工具使用

项目中提供了 `api` 工具，可用于统一的 API 调用：

```javascript
import api from '../utils/api'

// GET 请求
const data = await api.get('/api/endpoint', {
  // 可选配置
})

// POST 请求
const result = await api.post('/api/endpoint', {
  // 请求数据
}, {
  // 可选配置
})

// 文件上传
const uploadResult = await api.upload('upload-url', file, {
  onProgress: (percent) => {
    // 进度回调
  }
})

// 清除缓存
api.clearCache()
```

#### 配置说明

在 `src/config.js` 文件中，您可以配置以下 API 相关选项：

- **API 端点**：集中管理所有 API 端点
- **超时设置**：设置 API 请求超时时间
- **缓存配置**：配置缓存过期时间和启用状态
- **重试配置**：配置最大重试次数和延迟策略
- **网络配置**：配置上传并发数和连接超时
- **错误处理配置**：配置错误消息和详细程度

### 最佳实践

1. **使用 api 工具**：使用统一的 `api` 工具进行所有 API 调用
2. **合理配置**：根据实际需求调整 `config.js` 中的配置
3. **错误处理**：使用 try-catch 捕获并处理 API 错误
4. **性能优化**：对于大文件使用分片上传，利用断点续传功能
5. **安全性**：确保认证令牌的安全管理

### 调试

1. **查看 API 日志**：在浏览器控制台查看 API 请求和响应
2. **检查缓存状态**：使用 `api.clearCache()` 清除缓存进行测试
3. **监控上传进度**：使用 `uploadProgress` 和 `uploadSpeed` 监控上传状态
4. **错误排查**：根据错误消息和控制台日志进行排查
