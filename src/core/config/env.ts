const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7001/api',
  /** true = dùng dữ liệu giả (lưu localStorage). Khi BE xong: đặt VITE_USE_MOCK=false */
  useMock,
  /** Nhà cung cấp lưu ảnh: mock | http | cloudinary | s3 | azure. Mặc định http khi chạy với BE. */
  mediaProvider: import.meta.env.VITE_MEDIA_PROVIDER ?? (useMock ? 'mock' : 'http'),
  apiTimeoutMs: 15_000,
  tokenKey: 'opc_access_token',
} as const
