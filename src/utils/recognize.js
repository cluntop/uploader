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
const searchVideoId = async (title) => {
  try {
    const response = await api.get('/api/video/list', {
      params: {
        title,
        page: 1,
        page_size: 15
      }
    })
    
    return response.items || []
  } catch (e) {
    console.error('搜索视频失败:', e)
    return []
  }
}

// 获取视频 ID
const getVideoId = async (params) => {
  try {
    const response = await api.get('/api/video/getVideoId', {
      params
    })
    return response
  } catch (e) {
    console.error('获取视频 ID 失败:', e)
    throw e
  }
}

// 外部 API 识别
const recognizeByApi = async (filename) => {
  try {
    const response = await fetch(`${RECOGNIZE_API}?path=${encodeURIComponent(filename)}`)
    const data = await response.json()
    return data
  } catch (e) {
    console.error('API 识别失败:', e)
    return null
  }
}

// 正则表达式识别
const recognizeByRegex = (filename) => {
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
    searchTitle = parseName.substring(0, seMatch.index).replace(/\./g, ' ').trim()
    console.log(`正则 TV: ${searchTitle} S${season}E${episode}`)
  }
  // 匹配日期格式
  else if (/\d{4}[.-]\d{1,2}[.-]\d{1,2}/.test(parseName)) {
    searchType = 'tv'
    console.log(`正则 TV Date: ${searchTitle}`)
  }
  // 电影格式
  else {
    searchType = 'movie'
    searchTitle = parseName.replace(/\d{4}.*$/, '').replace(/\./g, ' ').trim()
    console.log(`正则 Movie: ${searchTitle}`)
  }
  
  return {
    searchType,
    searchTitle,
    season,
    episode
  }
}

// 搜索项目 ID
const searchItemId = async (filename, logger = console) => {
  logger.log(`开始搜刮: ${filename}`)
  
  // 检查手动映射
  const manualMap = getManualMap()
  if (manualMap[filename]) {
    const m = manualMap[filename]
    logger.log(`手动映射命中: ID ${m.video_id}`)
    return {
      video_id: m.video_id,
      item_type: m.item_type || 'vl',
      title: 'Manual Link',
      media_uuid: m.media_uuid || null
    }
  }
  
  let tmdbId = null
  let searchType = 'movie'
  let searchTitle = filename
  let season = 1
  let episode = 1
  
  // 尝试外部 API 识别
  const apiResult = await recognizeByApi(filename)
  if (apiResult && apiResult.media_info) {
    const m = apiResult.media_info
    const meta = apiResult.meta_info || {}
    const isTv = m.type === '电视剧' || meta.type === '电视剧' || 
                (meta.season_episode && meta.season_episode.includes('S'))
    
    searchType = isTv ? 'tv' : 'movie'
    tmdbId = m.tmdb_id
    
    if (isTv) {
      const seMatch = /S(\d+)\s*E(\d+)/i.exec(meta.season_episode || '')
      if (seMatch) {
        season = parseInt(seMatch[1])
        episode = parseInt(seMatch[2])
      }
    }
    
    if (tmdbId) {
      logger.log(`API 识别成功: TMDB ${tmdbId} S${season}E${episode}`)
    }
  }
  
  // 尝试通过 TMDB ID 获取视频 ID
  if (tmdbId) {
    logger.log(`精准定位中 (tmdb: ${tmdbId})...`)
    try {
      const params = {
        video_id_type: 'tmdb',
        video_id_value: tmdbId,
        season_number: searchType === 'tv' ? season : undefined,
        episode_number: searchType === 'tv' ? episode : undefined
      }
      
      const result = await getVideoId(params)
      
      if (searchType === 'tv') {
        if (result.episode_info && result.episode_info.item_id) {
          return {
            video_id: result.episode_info.item_id,
            item_type: 've',
            title: `${result.video_title} S${season}E${episode}`,
            media_uuid: null
          }
        }
        throw new Error(`剧集未找到 (S${season}E${episode})`)
      } else {
        if (result.item_id) {
          return {
            video_id: result.item_id,
            item_type: 'vl',
            title: result.video_title,
            media_uuid: null
          }
        }
      }
    } catch (e) {
      console.error('精准定位失败:', e)
    }
  }
  
  // 使用正则表达式识别
  const regexResult = recognizeByRegex(filename)
  searchType = regexResult.searchType
  searchTitle = regexResult.searchTitle
  season = regexResult.season
  episode = regexResult.episode
  
  // 搜索视频
  const searchResults = await searchVideoId(searchTitle)
  if (searchResults.length > 0) {
    const first = searchResults[0]
    logger.log(`首个结果: ${first.video_title} (${first.video_type})`)
    
    const targetTmdb = first.tmdb_id
    const targetTodb = first.todb_id
    
    if (searchType === 'tv' && first.video_type === 'tv') {
      if (targetTmdb || targetTodb) {
        try {
          const retryParams = {
            video_id_type: targetTmdb ? 'tmdb' : 'todb',
            video_id_value: targetTmdb || targetTodb,
            season_number: season,
            episode_number: episode
          }
          
          const retryResult = await getVideoId(retryParams)
          if (retryResult.episode_info) {
            return {
              video_id: retryResult.episode_info.item_id,
              item_type: 've',
              title: retryResult.episode_info.episode_title,
              media_uuid: null
            }
          }
        } catch (e) {
          console.error('重试获取视频 ID 失败:', e)
        }
        
        throw new Error(`无法定位 S${season}E${episode}`)
      }
    }
    
    if (searchType === 'movie' || first.video_type === 'vl') {
      return {
        video_id: first.video_id,
        item_type: 'vl',
        title: first.video_title,
        media_uuid: null
      }
    }
  }
  
  logger.log('最终无结果')
  throw new Error('识别失败 (详情见日志)')
}

export {
  searchItemId,
  addManualMap,
  clearManualMap,
  getManualMap
}