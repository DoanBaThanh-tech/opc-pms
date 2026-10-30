/** Toàn bộ đường dẫn API tập trung 1 chỗ, đổi BE chỉ sửa ở đây. */
export const endpoints = {
  products: '/products',
  pendingVersions: '/product-versions/pending-approval',
  media: '/media',
  dosageForms: '/dosage-forms',
  categories: '/categories',
  approvals: '/approvals',
  history: '/product-history',
  comparison: '/product-comparison',
  settings: '/settings',
} as const
