/* 
 * @Author: flkGit
 * @Date: 2026-01-29 10:00:00
 * @LastEditors: flkGit
 * @LastEditTime: 2026-01-29 10:00:00
 * @FilePath: /emos-uploader/src/utils/recognize.js
 * @Description: 文件识别逻辑
 *
 * Copyright (c) 2026 by flkGit, All Rights Reserved.
 */

import api from './api'
import { API_ENDPOINTS } from '../config'

// 识别 API 端点
const RECOGNIZE_API = 'https://emos.prlo.de/api/recognize'

// 手动映射存储
const MANUAL_MAP_KEY = 'manual_map'

// 获取手动映射
const getManualMap = () => {
  try {
    const saved = sessionStorage.getItem(MANUAL_MAP_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch (e) {
    console.error('获取手动映射失败:', e)
    return {}
  }
}

// 保存手动映射
const saveManualMap = (map) => {
  try {
    sessionStorage.setItem(MANUAL_MAP_KEY, JSON.stringify(map))
  } catch (e) {
    console.error('保存手动映射失败:', e)
  }
}

// 添加手动映射
const addManualMap = (filename, info) => {
  const map = getManualMap()
  map[filename] = info
  saveManualMap(map)
}

// 清除手动映射
const clearManualMap = (filename) => {
  const map = getManualMap()
  delete map[filename]
  saveManualMap(map)
}

// 搜索视频 ID
const searchVideoId = async (title, logger = console) => {
  try {
    logger.log(`搜索视频: ${title}`)
    // 优先使用新的搜索端点
    const newSearchParams = {
      title,
      page: 1,
      page_size: 15
    }
    
    const items = await searchVideoByNewEndpoint(newSearchParams, logger)
    
    // 如果新端点失败，回退到旧端点
    if (items.length === 0) {
      logger.log('新端点无结果，使用旧端点搜索')
      const response = await api.get(API_ENDPOINTS.VIDEO_LIST, {
        params: {
          title,
          page: 1,
          page_size: 15
        }
      })
      
      const oldItems = response.items || []
      logger.log(`旧端点搜索结果: ${oldItems.length} 个视频`)
      if (oldItems.length > 0) {
        logger.log(`首个结果: ${oldItems[0].video_title} (${oldItems[0].video_type})`)
      }
      return oldItems
    }
    
    return items
  } catch (e) {
    logger.error('搜索视频失败:', e)
    // 出错时回退到旧端点
    try {
      logger.log('新端点搜索失败，回退到旧端点')
      const response = await api.get(API_ENDPOINTS.VIDEO_LIST, {
        params: {
          title,
          page: 1,
          page_size: 15
        }
      })
      
      const items = response.items || []
      logger.log(`旧端点搜索结果: ${items.length} 个视频`)
      return items
    } catch (oldError) {
      logger.error('旧端点搜索也失败:', oldError)
      return []
    }
  }
}

// 使用新端点搜索视频
const searchVideoByNewEndpoint = async (params, logger = console) => {
  try {
    logger.log(`使用新端点搜索视频:`, params)
    const response = await api.get(API_ENDPOINTS.VIDEO_SEARCH, {
      params: {
        last_id: params.last_id,
        tmdb_id: params.tmdb_id,
        todb_id: params.todb_id,
        video_id: params.video_id,
        type: params.type,
        title: params.title,
        with_genre: params.with_genre,
        sort_by: params.sort_by,
        page: params.page || 1,
        page_size: params.page_size || 15
      }
    })
    
    const items = response.items || []
    logger.log(`新端点搜索结果: ${items.length} 个视频`)
    if (items.length > 0) {
      logger.log(`首个结果: ${items[0].video_title || items[0].title} (${items[0].video_type || items[0].type})`)
    }
    return items
  } catch (e) {
    logger.error('新端点搜索视频失败:', e)
    return []
  }
}



// 获取视频 ID
const getVideoId = async (params, logger = console) => {
  try {
    logger.log(`获取视频 ID:`, params)
    const response = await api.get(API_ENDPOINTS.GET_VIDEO_ID, {
      params
    })
    logger.log(`获取视频 ID 成功:`, response)
    return response
  } catch (e) {
    logger.error('获取视频 ID 失败:', e)
    throw e
  }
}

// 获取视频目录树
const getVideoTree = async (params, logger = console) => {
  try {
    logger.log(`获取视频目录树:`, params)
    const response = await api.get(API_ENDPOINTS.VIDEO_TREE, {
      params
    })
    logger.log(`获取视频目录树成功:`, response)
    return response
  } catch (e) {
    logger.error('获取视频目录树失败:', e)
    return null
  }
}

// 获取资源列表
const getMediaList = async (params, logger = console) => {
  try {
    logger.log(`获取资源列表:`, params)
    const response = await api.get(API_ENDPOINTS.MEDIA_LIST, {
      params
    })
    logger.log(`获取资源列表成功:`, response)
    return response
  } catch (e) {
    logger.error('获取资源列表失败:', e)
    return null
  }
}

// 外部 API 识别
const recognizeByApi = async (filename, logger = console) => {
  try {
    logger.log(`调用外部 API 识别: ${filename}`)
    const response = await fetch(`${RECOGNIZE_API}?path=${encodeURIComponent(filename)}`)
    logger.log(`API 响应状态: ${response.status}`)
    const data = await response.json()
    logger.log(`API 识别结果:`, data)
    return data
  } catch (e) {
    logger.error('API 识别失败:', e)
    return null
  }
}

// 正则表达式识别
const recognizeByRegex = (filename, logger = console) => {
  const parseName = filename.replace(/\.[^/.]+$/, '')
  let searchType = 'movie'
  let searchTitle = parseName
  let season = 1
  let episode = 1
  
  // 匹配 SxxExx 格式
  const seMatch = /S(\d+)\s*E(\d+)/i.exec(parseName)
  if (seMatch) {
    searchType = 'tv'
    season = parseInt(seMatch[1])
    episode = parseInt(seMatch[2])
    // 提取标题，处理各种分隔符
    searchTitle = parseName.substring(0, seMatch.index)
      .replace(/\./g, ' ')  // 替换点为空格
      .replace(/_/g, ' ')  // 替换下划线为空格
      .replace(/\s+/g, ' ')  // 合并多个空格
      .trim()
    // 移除常见的标记
    searchTitle = searchTitle.replace(/\[.*?\]/g, '').trim()
    searchTitle = searchTitle.replace(/\(.*?\)/g, '').trim()
    logger.log(`正则 TV: ${searchTitle} S${season}E${episode}`)
  }
  // 匹配 xx-xx 格式（如 01-02）
  else if (/\b(\d{1,2})[.-](\d{1,2})\b/.test(parseName)) {
    const episodeMatch = /\b(\d{1,2})[.-](\d{1,2})\b/.exec(parseName)
    if (episodeMatch) {
      searchType = 'tv'
      season = parseInt(episodeMatch[1])
      episode = parseInt(episodeMatch[2])
      searchTitle = parseName.substring(0, episodeMatch.index)
        .replace(/\./g, ' ')  // 替换点为空格
        .replace(/_/g, ' ')  // 替换下划线为空格
        .replace(/\s+/g, ' ')  // 合并多个空格
        .trim()
      // 移除常见的标记
      searchTitle = searchTitle.replace(/\[.*?\]/g, '').trim()
      searchTitle = searchTitle.replace(/\(.*?\)/g, '').trim()
      logger.log(`正则 TV (xx-xx): ${searchTitle} S${season}E${episode}`)
    }
  }
  // 匹配日期格式
  else if (/\d{4}[.-]\d{1,2}[.-]\d{1,2}/.test(parseName)) {
    searchType = 'tv'
    // 提取标题，移除日期部分
    searchTitle = parseName.replace(/\d{4}[.-]\d{1,2}[.-]\d{1,2}/, '')
      .replace(/\./g, ' ')  // 替换点为空格
      .replace(/_/g, ' ')  // 替换下划线为空格
      .replace(/\s+/g, ' ')  // 合并多个空格
      .trim()
    // 移除常见的标记
    searchTitle = searchTitle.replace(/\[.*?\]/g, '').trim()
    searchTitle = searchTitle.replace(/\(.*?\)/g, '').trim()
    logger.log(`正则 TV Date: ${searchTitle}`)
  }
  // 电影格式
  else {
    searchType = 'movie'
    // 提取标题，移除年份和其他标记
    // 处理以年份开头的文件名
    let tempName = parseName
    // 先移除 [...] 和 (...) 中的内容
    tempName = tempName.replace(/\[.*?\]/g, '').trim()
    tempName = tempName.replace(/\(.*?\)/g, '').trim()
    
    // 匹配年份（通常在标题中间或末尾）
    const yearMatch = /\b(19|20)\d{2}\b/.exec(tempName)
    if (yearMatch) {
      // 如果找到年份，移除年份及后面的内容
      searchTitle = tempName.substring(0, yearMatch.index)
        .replace(/\./g, ' ')  // 替换点为空格
        .replace(/_/g, ' ')  // 替换下划线为空格
        .replace(/\s+/g, ' ')  // 合并多个空格
        .trim()
    } else {
      // 如果没有找到年份，使用整个文件名
      searchTitle = tempName
        .replace(/\./g, ' ')  // 替换点为空格
        .replace(/_/g, ' ')  // 替换下划线为空格
        .replace(/\s+/g, ' ')  // 合并多个空格
        .trim()
    }
    
    // 进一步清理标题
    searchTitle = searchTitle
      .replace(/\b(HD|1080p|720p|480p|2160p|UHD|BluRay|DVD|WEB-DL|WEBRip|HDRip|BDRip|DVDRip)\b/gi, '')
      .replace(/\b(AC3|DTS|x264|x265|HEVC|AAC|MP3)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    // 增强鲁棒性：如果搜索标题为空，使用原始文件名
    if (!searchTitle || searchTitle.trim() === '') {
      searchTitle = parseName
        .replace(/\./g, ' ')  // 替换点为空格
        .replace(/_/g, ' ')  // 替换下划线为空格
        .replace(/\s+/g, ' ')  // 合并多个空格
        .trim()
    }
    
    logger.log(`正则 Movie: ${searchTitle}`)
  }
  
  // 进一步清理标题
  searchTitle = searchTitle
    .replace(/\b(HD|1080p|720p|480p|2160p|UHD|BluRay|DVD|WEB-DL|WEBRip|HDRip|BDRip|DVDRip)\b/gi, '')
    .replace(/\b(AC3|DTS|x264|x265|HEVC|AAC|MP3)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  return {
    searchType,
    searchTitle,
    season,
    episode
  }
}

// 搜索项目 ID
const searchItemId = async (filename, logger = console) => {
  const steps = []
  logger.log(`开始搜刮: ${filename}`)
  
  // 检查认证状态
  const token = sessionStorage.getItem('token')
  if (!token) {
    logger.error('未登录，无法搜索视频')
    steps.push({ name: '认证检查', status: '失败', message: '未登录，无法搜索视频' })
    const error = new Error('未登录，无法搜索视频')
    error.steps = steps
    error.type = 'auth_required'
    throw error
  }
  steps.push({ name: '认证检查', status: '成功', message: '已登录，可以搜索视频' })
  
  // 检查手动映射
  steps.push({ name: '手动映射检查', status: '开始', message: '检查是否有手动映射' })
  const manualMap = getManualMap()
  if (manualMap[filename]) {
    const m = manualMap[filename]
    logger.log(`手动映射命中: ID ${m.video_id}`)
    steps.push({ name: '手动映射检查', status: '成功', message: `找到手动映射: ID ${m.video_id}` })
    return {
      video_id: m.video_id,
      item_type: m.item_type || 'vl',
      title: 'Manual Link',
      media_uuid: m.media_uuid || null
    }
  }
  steps.push({ name: '手动映射检查', status: '失败', message: '未找到手动映射' })
  
  let tmdbId = null
  let searchType = 'movie'
  let searchTitle = filename
  let season = 1
  let episode = 1
  
  // 尝试外部 API 识别
  steps.push({ name: '外部 API 识别', status: '开始', message: '尝试通过外部 API 识别文件' })
  const apiResult = await recognizeByApi(filename, logger)
  if (apiResult && apiResult.media_info) {
    const m = apiResult.media_info
    const meta = apiResult.meta_info || {}
    const isTv = m.type === '电视剧' || meta.type === '电视剧' || 
                (meta.season_episode && meta.season_episode.includes('S'))
    
    searchType = isTv ? 'tv' : 'movie'
    tmdbId = m.tmdb_id
    
    // 设置搜索标题
    if (m.title) {
      searchTitle = m.title
    } else if (m.original_title) {
      searchTitle = m.original_title
    } else if (meta.name) {
      searchTitle = meta.name
    }
    
    logger.log(`API 识别标题: ${searchTitle}`)
    
    if (isTv) {
      const seMatch = /S(\d+)\s*E(\d+)/i.exec(meta.season_episode || '')
      if (seMatch) {
        season = parseInt(seMatch[1])
        episode = parseInt(seMatch[2])
      }
    }
    
    if (tmdbId) {
      logger.log(`API 识别成功: TMDB ${tmdbId} S${season}E${episode}`)
      steps.push({ name: '外部 API 识别', status: '成功', message: `API 识别成功: TMDB ${tmdbId} S${season}E${episode}` })
    } else {
      steps.push({ name: '外部 API 识别', status: '部分成功', message: 'API 识别成功但未返回 TMDB ID' })
    }
  } else {
    steps.push({ name: '外部 API 识别', status: '失败', message: '外部 API 识别失败，将使用正则表达式识别' })
  }
  
  // 尝试通过 TMDB ID 获取视频 ID
  if (tmdbId) {
    steps.push({ name: '精准定位', status: '开始', message: `通过 TMDB ID ${tmdbId} 精准定位视频` })
    try {
      // 尝试通过目录树 API 获取视频信息
      const treeParams = {
        type: searchType === 'tv' ? 'tv' : 'movie',
        tmdb_id: tmdbId
      }
      
      const treeResult = await getVideoTree(treeParams, logger)
      if (treeResult && treeResult.success) {
        steps.push({ name: '目录树查询', status: '成功', message: `通过目录树找到视频信息` })
        // 可以从目录树结果中获取更多信息
      } else {
        steps.push({ name: '目录树查询', status: '失败', message: '目录树查询无结果，使用常规方法' })
      }
      
      const params = {
        video_id_type: 'tmdb',
        video_id_value: tmdbId,
        season_number: searchType === 'tv' ? season : undefined,
        episode_number: searchType === 'tv' ? episode : undefined
      }
      
      const result = await getVideoId(params, logger)
      
      if (searchType === 'tv') {
        if (result.episode_info && result.episode_info.item_id) {
          steps.push({ name: '精准定位', status: '成功', message: `找到剧集: ${result.video_title} S${season}E${episode}` })
          return {
            video_id: result.episode_info.item_id,
            item_type: 've',
            title: `${result.video_title} S${season}E${episode}`,
            media_uuid: null
          }
        }
        steps.push({ name: '精准定位', status: '失败', message: `未找到剧集 S${season}E${episode}` })
      } else {
        if (result.item_id) {
          steps.push({ name: '精准定位', status: '成功', message: `找到电影: ${result.video_title}` })
          return {
            video_id: result.item_id,
            item_type: 'vl',
            title: result.video_title,
            media_uuid: null
          }
        }
        steps.push({ name: '精准定位', status: '失败', message: '未找到对应的视频' })
      }
    } catch (e) {
      logger.error('精准定位失败:', e)
      steps.push({ name: '精准定位', status: '失败', message: `精准定位失败: ${e.message}` })
    }
  }
  
  // 使用正则表达式识别
  steps.push({ name: '正则表达式识别', status: '开始', message: '使用正则表达式分析文件名' })
  const regexResult = recognizeByRegex(filename, logger)
  searchType = regexResult.searchType
  searchTitle = regexResult.searchTitle
  season = regexResult.season
  episode = regexResult.episode
  steps.push({ name: '正则表达式识别', status: '成功', message: `识别为 ${searchType === 'tv' ? '电视剧' : '电影'}: ${searchTitle} ${searchType === 'tv' ? `S${season}E${episode}` : ''}` })
  
  // 验证搜索标题
  if (!searchTitle || searchTitle.trim() === '') {
    // 尝试使用原始文件名作为fallback
    searchTitle = filename
      .replace(/\.[^/.]+$/, '')  // 移除扩展名
      .replace(/\[.*?\]/g, '')  // 移除 [...] 中的内容
      .replace(/\(.*?\)/g, '')  // 移除 (...) 中的内容
      .replace(/\./g, ' ')  // 替换点为空格
      .replace(/_/g, ' ')  // 替换下划线为空格
      .replace(/\s+/g, ' ')  // 合并多个空格
      .trim()
    
    // 再次验证
    if (!searchTitle || searchTitle.trim() === '') {
      logger.error('搜索标题为空，无法搜索视频')
      steps.push({ name: '标题验证', status: '失败', message: '搜索标题为空，无法搜索视频' })
      const error = new Error('搜索标题为空，无法搜索视频')
      error.steps = steps
      error.type = 'empty_title'
      throw error
    } else {
      logger.log(`使用原始文件名作为搜索标题: ${searchTitle}`)
      steps.push({ name: '标题验证', status: '成功', message: `使用原始文件名作为搜索标题: ${searchTitle}` })
    }
  } else {
    steps.push({ name: '标题验证', status: '成功', message: `搜索标题: ${searchTitle}` })
  }
  
  // 搜索视频
  steps.push({ name: '视频搜索', status: '开始', message: `搜索 ${searchType === 'tv' ? '电视剧' : '电影'}: ${searchTitle}` })
  try {
    // 使用新的搜索端点进行更详细的搜索
    const newSearchParams = {
      title: searchTitle,
      type: searchType === 'tv' ? 'tv' : 'movie',
      page: 1,
      page_size: 15
    }
    
    let searchResults = await searchVideoByNewEndpoint(newSearchParams, logger)
    
    // 如果新端点无结果，使用旧的搜索方法
    if (searchResults.length === 0) {
      steps.push({ name: '视频搜索', status: '部分成功', message: '新端点无结果，使用旧的搜索方法' })
      searchResults = await searchVideoId(searchTitle, logger)
    }
    
    if (searchResults.length > 0) {
      // 优先选择有 tmdb_id 的结果
      const tmdbResult = searchResults.find(item => item.tmdb_id)
      const first = tmdbResult || searchResults[0]
      
      logger.log(`首选结果: ${first.video_title || first.title} (${first.video_type || first.type})${first.tmdb_id ? ` TMDB: ${first.tmdb_id}` : ''}`)
      steps.push({ name: '视频搜索', status: '成功', message: `找到 ${searchResults.length} 个结果，使用 ${first.tmdb_id ? 'TMDB 匹配' : '首个'}结果: ${first.video_title || first.title}` })
      
      const targetTmdb = first.tmdb_id
      const targetTodb = first.todb_id || first.todbId
      
      // 如果有 tmdb_id，优先使用 tmdb_id 进行定位
      if (targetTmdb) {
        steps.push({ name: 'TMDB 定位', status: '开始', message: `使用 TMDB ID ${targetTmdb} 定位视频` })
        try {
          const tmdbParams = {
            video_id_type: 'tmdb',
            video_id_value: targetTmdb,
            season_number: searchType === 'tv' ? season : undefined,
            episode_number: searchType === 'tv' ? episode : undefined
          }
          
          const tmdbResult = await getVideoId(tmdbParams, logger)
          
          if (searchType === 'tv') {
            if (tmdbResult.episode_info && tmdbResult.episode_info.item_id) {
              steps.push({ name: 'TMDB 定位', status: '成功', message: `找到剧集: ${tmdbResult.video_title} S${season}E${episode}` })
              return {
                video_id: tmdbResult.episode_info.item_id,
                item_type: 've',
                title: `${tmdbResult.video_title} S${season}E${episode}`,
                media_uuid: null
              }
            }
            steps.push({ name: 'TMDB 定位', status: '失败', message: `未找到剧集 S${season}E${episode}` })
          } else {
            if (tmdbResult.item_id) {
              steps.push({ name: 'TMDB 定位', status: '成功', message: `找到电影: ${tmdbResult.video_title}` })
              return {
                video_id: tmdbResult.item_id,
                item_type: 'vl',
                title: tmdbResult.video_title,
                media_uuid: null
              }
            }
            steps.push({ name: 'TMDB 定位', status: '失败', message: '未找到对应的视频' })
          }
        } catch (e) {
          logger.error('TMDB 定位失败:', e)
          steps.push({ name: 'TMDB 定位', status: '失败', message: `TMDB 定位失败: ${e.message}` })
        }
      }
      
      if (searchType === 'tv' && first.video_type === 'tv') {
        if (targetTmdb || targetTodb) {
          steps.push({ name: '剧集定位', status: '开始', message: `尝试定位剧集 S${season}E${episode}` })
          try {
            const retryParams = {
              video_id_type: targetTmdb ? 'tmdb' : 'todb',
              video_id_value: targetTmdb || targetTodb,
              season_number: season,
              episode_number: episode
            }
            
            const retryResult = await getVideoId(retryParams, logger)
            if (retryResult.episode_info) {
              steps.push({ name: '剧集定位', status: '成功', message: `找到剧集: ${retryResult.episode_info.episode_title}` })
              return {
                video_id: retryResult.episode_info.item_id,
                item_type: 've',
                title: retryResult.episode_info.episode_title,
                media_uuid: null
              }
            }
            steps.push({ name: '剧集定位', status: '失败', message: `未找到剧集 S${season}E${episode}` })
          } catch (e) {
            logger.error('重试获取视频 ID 失败:', e)
            steps.push({ name: '剧集定位', status: '失败', message: `剧集定位失败: ${e.message}` })
          }
          
          const error = new Error(`无法定位 S${season}E${episode}`)
          error.steps = steps
          error.type = 'episode_not_found'
          throw error
        }
      }
      
      if (searchType === 'movie' || first.video_type === 'vl') {
        steps.push({ name: '视频匹配', status: '成功', message: `匹配到视频: ${first.video_title}` })
        return {
          video_id: first.video_id,
          item_type: 'vl',
          title: first.video_title,
          media_uuid: null
        }
      }
    } else {
      logger.error('未找到相关视频')
      steps.push({ name: '视频搜索', status: '失败', message: `未找到相关 ${searchType === 'tv' ? '电视剧' : '电影'}` })
    }
  } catch (e) {
    logger.error('搜索视频失败:', e)
    steps.push({ name: '视频搜索', status: '失败', message: `搜索视频失败: ${e.message}` })
  }
  
  logger.log('最终无结果')
  const error = new Error('识别失败 (详情见日志)')
  error.steps = steps
  error.type = 'recognition_failed'
  throw error
}

export {
  searchItemId,
  searchVideoId,
  searchVideoByNewEndpoint,
  addManualMap,
  clearManualMap,
  getManualMap,
  getVideoTree,
  getMediaList
}