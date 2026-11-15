import http from '@/utils/http'

// 获取标签
export interface Labels {
  id: string
  label_name: string
  created_at: string
}
interface getLabelsRef {
  data: Labels[]
  code: number
  message: string
}
export const getLabels = (params?: { keyword?: string }) => {
  return http.post<any, getLabelsRef>('/labels/getLabels', params)
}

/** 只返回提示语、没有载荷的操作响应 */
interface ActionRes {
  code: number
  message: string
  data: null
}

// 插入标签
export const insertLabels = (data: { label_name: string }) => {
  return http.post<any, ActionRes>('/labels/insertLabels', data)
}

// 更新标签
export const updateLabels = (data: { id: string; label_name: string }) => {
  return http.post<any, ActionRes>('/labels/updateLabels', data)
}

// 删除标签
export const deleteLabels = (data: { id: string }) => {
  return http.post<any, ActionRes>('/labels/deleteLabels', data)
}
