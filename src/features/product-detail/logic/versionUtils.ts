import type { ProductVersion } from './types'
import { STAGE_ORDER } from './types'

/** So sánh phiên bản dạng 1.2.10 > 1.2.9 */
export function compareVersion(a: string, b: string) {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/** Coming soon lên đầu, rồi hiện hành, cuối cùng là lưu trữ (mới nhất trước). */
export function sortVersions(versions: ProductVersion[]) {
  return [...versions].sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || compareVersion(b.version, a.version))
}

export function getCurrentVersion(versions: ProductVersion[]) {
  return versions.find((v) => v.stage === 'current')
}

export function getComingSoonVersion(versions: ProductVersion[]) {
  return [...versions].filter((v) => v.stage === 'coming_soon').sort((a, b) => compareVersion(b.version, a.version))[0]
}

/** Phiên bản đứng ngay trước phiên bản đang xét (dùng cho báo cáo so sánh). */
export function previousVersionOf(versions: ProductVersion[], target: ProductVersion) {
  if (target.basedOnVersion) {
    const explicit = versions.find((v) => v.id !== target.id && v.version === target.basedOnVersion)
    if (explicit) return explicit
  }
  return versions
    .filter((v) => v.id !== target.id && compareVersion(v.version, target.version) < 0)
    .sort((a, b) => compareVersion(b.version, a.version))[0]
}

export function latestVersionOf(versions: ProductVersion[]) {
  return [...versions].sort((a, b) => compareVersion(b.version, a.version))[0]
}

export function isReadOnly(stage: ProductVersion['stage']) {
  return stage !== 'current'
}

/** Gợi ý số phiên bản kế tiếp: 2.1 → 2.2, 3.0 → 3.1. */
export function suggestNextVersion(current: string) {
  const parts = current.split('.').map((p) => Number.parseInt(p, 10) || 0)
  if (!parts.length) return '1.0'
  if (parts.length === 1) return `${parts[0] + 1}.0`
  parts[parts.length - 1] += 1
  return parts.join('.')
}

/** Ngày hôm nay dạng YYYY-MM-DD theo giờ địa phương. */
export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Phiên bản chỉ được đưa vào sử dụng từ ngày hiệu lực. */
export function isVersionDue(version: ProductVersion, onDate = todayIso()) {
  return version.effectiveDate.slice(0, 10) <= onDate
}

/** Số kế tiếp dựa trên phiên bản cao nhất đã có (kể cả Coming soon). */
export function suggestNextVersionAfter(versions: ProductVersion[]) {
  const latest = latestVersionOf(versions)
  return latest ? suggestNextVersion(latest.version) : '1.0'
}
