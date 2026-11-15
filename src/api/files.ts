import http from '@/utils/http'
// 文件对象（根据 files 表推断，字段名可按实际表结构调整）
export interface FileItem {
  id: string
  user_id: string
  file_name: string
  type: string
  size: string
  url: string
  created_at: string
  article_id: string | null // 关联文章ID (uuid，可为 null)
  gallery_id: string | null // 关联画廊ID (uuid，可为 null)
}
interface FileRes {
  code: number
  message: string
  data: {
    files: FileItem[]
    pageNum: number
    pageSize: number
  }
}

// 获取文件（分页查询）
// 注意：后端 file_urls 实际用于 `id = ANY(...)` 过滤，因此需传入 id 数组
export const getFiles = (data: {
  pageNum?: number // 页码，默认 1
  pageSize?: number // 每页条数，默认 10，最大 100
  file_urls?: string | string[] // 实际用作 id 过滤（单值/多值均可）
}) => {
  return http.post<any, FileRes>('/files/getFile', data)
}

// 获取文件总数
interface TotalFileRes {
  code: number
  message: string
  data: {
    total: number
  }
}
export const getTotalFile = (data?: { file_urls?: string | string[] }) => {
  return http.post<any, TotalFileRes>('/files/getTotalFile', data || {})
}

// 获取 data 目录占用（总览页「本地文件」卡片用）
interface StorageSizeRes {
  code: number
  message: string
  data: {
    bytes: number // 字节数
    count: number // 文件个数
    text: string // 已格式化的文案，如 434.36 MB
  }
}
export const getStorageSize = () => {
  return http.post<any, StorageSizeRes>('/files/getStorageSize')
}

/**
 * 上传文件统一走 multer 的 multipart 接口：POST /files/uploadFile，字段名 file。
 *
 * 这里不再包一个 api 函数 —— 上传要带进度/超时/取消，调用方（文章抽屉、
 * 图库抽屉、随笔编辑器）各自用 FormData 直接调 http 更清晰。
 * 之前的 uploadFile 打的是不存在的 /files/upload，属于死代码，已删除。
 */
