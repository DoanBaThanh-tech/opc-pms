export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ListQuery {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface ApiError {
  status: number
  message: string
  details?: unknown
}
