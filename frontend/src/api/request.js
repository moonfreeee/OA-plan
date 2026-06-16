import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import createMockClient from '@/mock/handler'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const request = USE_MOCK
  ? createMockClient()
  : axios.create({
      baseURL: '/api/v1',
      timeout: 15000
    })

if (!USE_MOCK) {
  request.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  request.interceptors.response.use(
    (response) => {
      const res = response.data
      if (res.code !== 0) {
        ElMessage.error(res.message || '请求失败')
        return Promise.reject(new Error(res.message))
      }
      return res
    },
    (error) => {
      const msg = error.response?.data?.message || error.message || '网络错误'
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
      ElMessage.error(msg)
      return Promise.reject(error)
    }
  )
} else {
  console.info('[SDO OA] 演示模式已开启（VITE_USE_MOCK=true），无需后端即可浏览页面')
}

export default request
export { USE_MOCK }
