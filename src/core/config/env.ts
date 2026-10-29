export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7001/api',
  /** true = dùng dữ liệu giả (lưu localStorage). Khi BE xong: đặt VITE_USE_MOCK=false */
  useMock: import.meta.env.VITE_USE_MOCK !== 'false',
  apiTimeoutMs: 15_000,
  tokenKey: 'opc_access_token',
} as const
