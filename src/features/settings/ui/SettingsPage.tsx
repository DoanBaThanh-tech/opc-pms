import { useState, type ReactNode } from 'react'
import { Database, Monitor, Server } from 'lucide-react'
import { resetMockData } from '@/core/api/mock'
import { Button } from '@/core/components/Button'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { Input } from '@/core/components/Input'
import { PageHeader } from '@/core/components/PageHeader'
import { env } from '@/core/config/env'
import { cn } from '@/core/utils/format'
import { updateSettings, useSettings } from '../logic/settingsStore'

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-soft md:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-bold text-brand-900"><span className="text-brand-500">{icon}</span>{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export default function SettingsPage() {
  const s = useSettings()
  const [confirm, setConfirm] = useState(false)

  return (
    <>
      <PageHeader title="Cài đặt" description="Thiết lập hiển thị và kết nối" />
      <div className="grid max-w-4xl gap-5 lg:grid-cols-2">
        <Section icon={<Monitor className="size-5" />} title="Hiển thị">
          <Input label="Tên hiển thị" value={s.displayName} maxLength={40} onChange={(e) => updateSettings({ displayName: e.target.value })} />
          <div>
            <p className="mb-1.5 text-sm font-medium">Số dòng mỗi trang (Danh mục sản phẩm)</p>
            <div className="inline-flex rounded-xl border border-line p-1">
              {[10, 20, 50].map((n) => (
                <button key={n} onClick={() => updateSettings({ pageSize: n })} className={cn('rounded-lg px-4 py-1.5 text-sm font-semibold transition', s.pageSize === n ? 'bg-brand-600 text-white' : 'text-muted hover:text-brand-700')}>{n}</button>
              ))}
            </div>
          </div>
        </Section>

        <Section icon={<Server className="size-5" />} title="Kết nối">
          <div>
            <p className="text-sm font-medium">Chế độ dữ liệu</p>
            <p className="mt-1 text-sm text-muted">{env.useMock ? 'Dữ liệu giả (lưu trên trình duyệt)' : 'API thật (BE C#)'}</p>
          </div>
          <div>
            <p className="text-sm font-medium">API Base URL</p>
            <p className="mt-1 break-all rounded-lg bg-brand-50 px-3 py-2 font-mono text-xs text-brand-800">{env.apiBaseUrl}</p>
          </div>
          <p className="text-xs text-muted">Đổi trong file <code>.env</code>: <code>VITE_API_BASE_URL</code>, <code>VITE_USE_MOCK</code>.</p>
        </Section>

        {env.useMock && (
          <Section icon={<Database className="size-5" />} title="Dữ liệu mẫu">
            <p className="text-sm text-muted">Xóa mọi thay đổi bạn đã thêm/sửa và quay về dữ liệu mẫu ban đầu.</p>
            <Button variant="danger" onClick={() => setConfirm(true)}>Khôi phục dữ liệu mẫu</Button>
          </Section>
        )}
      </div>
      <ConfirmDialog
        open={confirm} title="Khôi phục dữ liệu mẫu" message="Toàn bộ dữ liệu bạn đã tạo sẽ bị xóa. Tiếp tục?"
        confirmText="Khôi phục" onClose={() => setConfirm(false)}
        onConfirm={() => { resetMockData(); window.location.reload() }}
      />
    </>
  )
}
