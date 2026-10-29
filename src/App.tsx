import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/core/api/queryClient'
import { ToastProvider } from '@/core/components/Toast'
import { router } from '@/core/router'
import { versionsDb } from '@/features/product-detail/logic/versionApi'

export default function App() {
  // Giữ bộ dữ liệu phiên bản mẫu trong localStorage ngay từ đầu để đồng bộ khi sửa sản phẩm.
  useEffect(() => { versionsDb.persist() }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  )
}
