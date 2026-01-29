# 第一阶段：构建项目
FROM node:18-alpine AS build

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build

# 第二阶段：运行服务
FROM node:18-alpine

WORKDIR /app

# 安装 serve 包
RUN npm install -g serve

# 从构建阶段复制构建产物
COPY --from=build /app/dist /app/dist

# 暴露端口
EXPOSE 3000

# 运行服务
CMD ["serve", "-s", "dist", "-l", "3000"]