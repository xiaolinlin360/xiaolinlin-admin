import http from '@/utils/http'

// 只返回提示语、没有载荷的操作响应
interface ActionRes {
  code: number
  message: string
  data: null
}

//添加分组
export const insertSubset = (data: { category_id: string | undefined; name: string }) => {
  return http.post<any, ActionRes>('/subsets/insertSubset', data)
}

//更新分组
export const updateSubset = (data: { id: string; name: string }) => {
  return http.post<any, ActionRes>('/subsets/updateSubset', data)
}

//删除分组
export const deleteSubset = (data: { id: string }) => {
  return http.post<any, ActionRes>('/subsets/deleteSubset', data)
}

// 拿到categoryController中的所有子集
export interface CategoryRef {
  id: string
  name: string
  created_at: string
  path: string
}
interface getCategoryRef {
  data: CategoryRef[]
  code: number
  message: string
}
export const getCategory = () => {
  return http.post<any, getCategoryRef>('/subsets/getCategory')
}

// 拿到subsetController中的所有子集
export interface SubsetRef {
  id: string
  name: string
  created_at: string
}
interface getSubsetRef {
  data: SubsetRef[]
  code: number
  message: string
}
export const getSubset = (data: { category_id: string | undefined; keyword?: string }) => {
  return http.post<any, getSubsetRef>('/subsets/getSubset', data)
}
