import { BadgeCheck, GitCompare, History, Layers, Package, Pill, Settings, UsersRound, type LucideIcon } from 'lucide-react'

export interface NavItem { path: string; label: string; icon: LucideIcon }

/** Thứ tự đúng như yêu cầu: trên → dưới */
export const navItems: NavItem[] = [
  { path: '/products', label: 'Danh mục sản phẩm', icon: Package },
  { path: '/dosage-forms', label: 'Dạng bào chế', icon: Pill },
  { path: '/categories', label: 'Phân loại', icon: Layers },
  { path: '/approvals', label: 'Phê duyệt sản phẩm', icon: BadgeCheck },
  { path: '/roles', label: 'Vai trò & phân quyền', icon: UsersRound },
  { path: '/history', label: 'Lịch sử sản phẩm', icon: History },
  { path: '/comparison', label: 'So sánh sản phẩm', icon: GitCompare },
  { path: '/settings', label: 'Cài đặt', icon: Settings },
]
