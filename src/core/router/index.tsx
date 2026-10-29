import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/core/layout/AppLayout'
import ProductsPage from '@/features/products/ui/ProductsPage'
import ProductDetailPage from '@/features/product-detail/ui/ProductDetailPage'
import DosageFormsPage from '@/features/dosage-forms/ui/DosageFormsPage'
import CategoriesPage from '@/features/categories/ui/CategoriesPage'
import ApprovalsPage from '@/features/approvals/ui/ApprovalsPage'
import HistoryPage from '@/features/history/ui/HistoryPage'
import ComparisonPage from '@/features/comparison/ui/ComparisonPage'
import SettingsPage from '@/features/settings/ui/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/products" replace /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'dosage-forms', element: <DosageFormsPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'approvals', element: <ApprovalsPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'comparison', element: <ComparisonPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/products" replace /> },
    ],
  },
])
