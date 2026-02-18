/**
 * @Author: flkGit
 * @Date: 2026-02-18 10:00:00
 * @LastEditors: flkGit
 * @LastEditTime: 2026-02-18 10:00:00
 * @FilePath: /emos-uploader/src/utils/logger.js
 * @Description: 标准化日志工具
 *
 * Copyright (c) 2026 by flkGit, All Rights Reserved.
 */

// 日志级别
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

// 获取当前时间戳
const getTimestamp = () => {
  return new Date().toISOString();
};

// 格式化日志消息
const formatMessage = (level, message, details = null) => {
  const timestamp = getTimestamp();
  let formattedMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (details) {
    if (typeof details === 'object') {
      try {
        formattedMessage += '\nDetails: ' + JSON.stringify(details, null, 2);
      } catch (error) {
        formattedMessage += '\nDetails: ' + String(details);
      }
    } else {
      formattedMessage += '\nDetails: ' + details;
    }
  }
  
  return formattedMessage;
};

// 日志工具类
const logger = {
  // 调试日志
  debug: (message, details = null) => {
    const formattedMessage = formatMessage(LOG_LEVELS.DEBUG, message, details);
    console.debug(formattedMessage);
  },
  
  // 信息日志
  info: (message, details = null) => {
    const formattedMessage = formatMessage(LOG_LEVELS.INFO, message, details);
    console.log(formattedMessage);
  },
  
  // 警告日志
  warn: (message, details = null) => {
    const formattedMessage = formatMessage(LOG_LEVELS.WARN, message, details);
    console.warn(formattedMessage);
  },
  
  // 错误日志
  error: (message, details = null) => {
    const formattedMessage = formatMessage(LOG_LEVELS.ERROR, message, details);
    console.error(formattedMessage);
  },
  
  // 操作成功日志
  success: (message, details = null) => {
    const formattedMessage = formatMessage('SUCCESS', message, details);
    console.log('%c' + formattedMessage, 'color: green; font-weight: bold');
  },
  
  // 操作失败日志
  failure: (message, details = null) => {
    const formattedMessage = formatMessage('FAILURE', message, details);
    console.error('%c' + formattedMessage, 'color: red; font-weight: bold');
  },
  
  // API请求日志
  apiRequest: (method, url, data = null, headers = null) => {
    const details = {
      method,
      url,
      data,
      headers
    };
    const formattedMessage = formatMessage('API_REQUEST', `API Request: ${method} ${url}`, details);
    console.log(formattedMessage);
  },
  
  // API响应日志
  apiResponse: (status, statusText, url, responseTime = null, data = null) => {
    const details = {
      status,
      statusText,
      url,
      responseTime,
      data
    };
    const formattedMessage = formatMessage('API_RESPONSE', `API Response: ${status} ${statusText} for ${url}`, details);
    
    if (status >= 200 && status < 300) {
      console.log('%c' + formattedMessage, 'color: green');
    } else if (status >= 400 && status < 500) {
      console.warn('%c' + formattedMessage, 'color: orange');
    } else if (status >= 500) {
      console.error('%c' + formattedMessage, 'color: red');
    } else {
      console.log(formattedMessage);
    }
  },
  
  // 认证相关日志
  auth: (message, details = null) => {
    const formattedMessage = formatMessage('AUTH', message, details);
    console.log('%c' + formattedMessage, 'color: blue');
  },
  
  // 上传相关日志
  upload: (message, details = null) => {
    const formattedMessage = formatMessage('UPLOAD', message, details);
    console.log('%c' + formattedMessage, 'color: purple');
  }
};

export default logger;