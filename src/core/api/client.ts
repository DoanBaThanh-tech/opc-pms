import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { env } from '@/core/config/env'
import type { ApiError } from '@/core/types/common'

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(env.tokenKey)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string; title?: string }>) => {
    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message:
        error.response?.data?.message ??
        error.response?.data?.title ??
        (error.code === 'ECONNABORTED'
          ? 'Máy chủ phản hồi quá lâu, vui lòng thử lại.'
          : error.response
            ? 'Đã có lỗi xảy ra, vui lòng thử lại.'
            : 'Không kết nối được tới máy chủ.'),
      details: error.response?.data,
    }
    return Promise.reject(apiError)
  },
)

/** Trả thẳng `data`; lỗi đã được chuẩn hóa thành ApiError. */
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) => apiClient.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => apiClient.post<T>(url, body, config).then((r) => r.data),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => apiClient.put<T>(url, body, config).then((r) => r.data),
  delete: <T = void>(url: string, config?: AxiosRequestConfig) => apiClient.delete<T>(url, config).then((r) => r.data),
}
