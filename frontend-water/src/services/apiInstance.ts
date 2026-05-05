import axios from 'axios'
import { toSnake, toCamel } from '../utils/caseConverter'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token)
    config.headers.Authorization = `Bearer ${token}`
  if (config.data)
    config.data = toSnake(config.data)
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    response.data = toCamel(response.data)
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient