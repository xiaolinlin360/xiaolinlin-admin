import http from '@/utils/http'

//验证是否注册
export const isRegistered = (data: { id: string }) => {
  return http.post('/user/isRegistered', data)
}

//注册用户
// TODO 这个函数和后端还不一致：后端 /user/insertUser 要的是 id/name/email/created_at，
// 而且 users.password 是 NOT NULL，不带密码插入必然 500。做注册功能时要一起改。
export const register = (data: { name: string; password: string }) => {
  return http.post('/user/insertUser', data)
}

//登录
export interface LoginUser {
  id: string
  name: string
  email: string | null
  phone: string | null
  /** 权限等级：数字越小权限越大，0 为最高 */
  permission: number
  imgurl: string
  created_at: string
}

interface LoginRes {
  code: number
  message: string
  /** token 放进了 data，信封统一为三件套 */
  data: {
    token: string
    user: LoginUser
  }
}
export const login = (data: { name: string; password: string }) => {
  return http.post<any, LoginRes>('/user/login', data)
}

// --- 个人主页 ---

/** 个人信息（结构和登录返回的 user 一致） */
export type Profile = LoginUser

interface ProfileRes {
  code: number
  message: string
  data: Profile
}
export const getProfile = () => {
  return http.post<any, ProfileRes>('/user/getProfile')
}

export const updateProfile = (data: { name: string; imgurl: string }) => {
  return http.post<any, ProfileRes>('/user/updateProfile', data)
}
