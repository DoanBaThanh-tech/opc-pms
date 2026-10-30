import { http } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'
import { createMockCollection, mockError } from '@/core/api/mock'
import { roleMeta, type RoleKey } from '@/core/auth/roles'
import { env } from '@/core/config/env'
import { formatDate } from '@/core/utils/format'
import { logHistory } from '@/features/history/logic/historyApi'
import { productsDb } from '@/features/products/logic/productApi'
import { clonePackagingSpecsForVersion } from './packagingSpecs'
import { baselineVersionFor, seedVersions } from './seedVersions'
import type { CreateVersionInput, PackagingSpec, ProductVersion, UpdateVersionInfoInput, VersionDocument } from './types'
import {
  approvalStatusOf, approverRoleOf, canRoleAct, canRoleResubmit, inferRoleScope,
} from './approvalUtils'
import { applyVersionInfo } from './versionUpdates'
import { compareVersion, isVersionDue, sortVersions } from './versionUtils'

export const versionsDb = createMockCollection<ProductVersion>('product_versions', seedVersions)

const now = () => new Date().toISOString()
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const compactVersion = (version: string) => version.replace(/\./g, '')

function stripId<T extends { id: number }>(item: T): Omit<T, 'id'> {
  const copy: Partial<T> = { ...item }
  delete copy.id
  return copy as Omit<T, 'id'>
}

function requireProduct(productId: number) {
  const product = productsDb.snapshot().find((p) => p.id === productId)
  if (!product) throw mockError('Không tìm thấy sản phẩm.', 404)
  return product
}

/** Đồng bộ trạng thái tài liệu đính kèm khi phiên bản đổi trạng thái. */
function docsStatusPatch(version: ProductVersion, status: 'valid' | 'superseded') {
  return {
    packagingSpecs: version.packagingSpecs?.map((spec) => ({
      ...spec,
      technicalDoc: { ...spec.technicalDoc, status },
    })),
    extraDocs: version.extraDocs?.map((doc) => ({ ...doc, status })),
  }
}

/** Ký xác thực toàn bộ tài liệu sau khi hồ sơ hoàn tất phê duyệt. */
function docsSignedPatch(version: ProductVersion) {
  const signedAt = now()
  return {
    signedAt,
    packagingSpecs: version.packagingSpecs?.map((spec) => ({
      ...spec,
      technicalDoc: { ...spec.technicalDoc, verified: true },
    })),
    extraDocs: version.extraDocs?.map((doc) => ({ ...doc, verified: true })),
  }
}

/** Áp dụng phiên bản thành phiên bản đang lưu hành, chuyển bản cũ sang lưu trữ. */
function applyActivation(productId: number, target: ProductVersion, activatedOn: string) {
  versionsDb.snapshot()
    .filter((v) => v.productId === productId && v.stage === 'current')
    .forEach((v) => versionsDb.patch(v.id, {
      stage: 'archived',
      summary: `Phiên bản lưu trữ – đã được phiên bản ${target.version} thay thế từ ngày ${formatDate(activatedOn)}.`,
      ...docsStatusPatch(v, 'superseded'),
    }))

  const activated = versionsDb.patch(target.id, {
    stage: 'current',
    approvalStatus: 'approved',
    effectiveDate: activatedOn,
    appliedAt: now(),
    updatedAt: now(),
    approvedBy: target.approvedBy || 'Tổ ĐK Thuốc – Công ty CP Dược phẩm OPC',
    summary: `Phiên bản ${target.version} đã được đưa vào sử dụng từ ngày ${formatDate(activatedOn)}.`,
    ...docsStatusPatch(target, 'valid'),
  })
  const updatedProduct = productsDb.patch(productId, { version: target.version, updatedAt: now() })
  logHistory(updatedProduct, 'updated', `Áp dụng phiên bản ${target.version} vào sử dụng`)
  return activated
}

/** Mô phỏng API phiên bản sản phẩm. BE C# sẽ thay thế cùng contract. */
export const versionApi = {
  list: async (productId: number): Promise<ProductVersion[]> => {
    if (!env.useMock) return http.get<ProductVersion[]>(`${endpoints.products}/${productId}/versions`)
    const all = await versionsDb.all()
    const items = all.filter((v) => v.productId === productId)
    if (items.length) return sortVersions(items)

    // Sản phẩm vừa tạo từ danh mục chưa có phiên bản → khởi tạo phiên bản hiện hành đầu tiên.
    const product = productsDb.snapshot().find((p) => p.id === productId)
    if (!product) return []
    const created = versionsDb.insert(stripId(baselineVersionFor(product)))
    return [created]
  },

  /** Hàng đợi xử lý phiên bản: gồm chờ xử lý, chờ duyệt, đã duyệt và bị từ chối. */
  listApprovalVersions: async (): Promise<ProductVersion[]> => {
    if (!env.useMock) return http.get<ProductVersion[]>(endpoints.pendingVersions)
    const all = await versionsDb.all()
    return all
      .filter((v) => v.stage === 'coming_soon')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || compareVersion(b.version, a.version))
  },

  create: async (productId: number, input: CreateVersionInput): Promise<ProductVersion> => {
    if (!env.useMock) return http.post<ProductVersion>(`${endpoints.products}/${productId}/versions`, input)
    const product = requireProduct(productId)
    const versions = versionsDb.snapshot().filter((v) => v.productId === productId)
    if (!versions.length) throw mockError('Chưa có dữ liệu phiên bản để kế thừa.', 409)
    if (versions.some((v) => v.version.trim().toLowerCase() === input.version.trim().toLowerCase())) {
      throw mockError(`Phiên bản ${input.version.trim()} đã tồn tại.`, 409)
    }

    const base = versions.find((v) => v.stage === 'current') ?? sortVersions(versions)[0]
    const autoChanges: ProductVersion['changes'] = []
    if (input.activeIngredients.trim() !== base.activeIngredients) {
      autoChanges.push({ field: 'Hoạt chất & hàm lượng', before: base.activeIngredients, after: input.activeIngredients.trim(), kind: 'updated' })
    }
    if (input.packaging.trim() !== base.packaging) {
      autoChanges.push({ field: 'Quy cách đóng gói', before: base.packaging, after: input.packaging.trim(), kind: 'updated' })
    }
    if (input.shelfLife.trim() !== base.shelfLife) {
      autoChanges.push({ field: 'Hạn dùng', before: base.shelfLife, after: input.shelfLife.trim(), kind: 'updated' })
    }
    if (input.regulation.trim() !== base.regulation) {
      autoChanges.push({ field: 'Quy định', before: base.regulation, after: input.regulation.trim(), kind: 'updated' })
    }
    if (input.manufacturer.trim() !== base.manufacturer) {
      autoChanges.push({ field: 'Nơi sản xuất', before: base.manufacturer, after: input.manufacturer.trim(), kind: 'updated' })
    }
    if (input.manufacturingMethod.trim() !== base.manufacturingMethod) {
      autoChanges.push({ field: 'Cách thức sản xuất', before: base.manufacturingMethod, after: input.manufacturingMethod.trim(), kind: 'updated' })
    }

    const nextVersion = input.version.trim()
    const createdAt = now()
    const compact = compactVersion(nextVersion)
    const allChanges = [...autoChanges, ...input.customChanges]
    const roleScope = inferRoleScope(allChanges, (input.extraDocs ?? []).map((doc) => doc.group))
    const sourceSpecs = input.packagingSpecs?.length
      ? input.packagingSpecs
      : clonePackagingSpecsForVersion(product, base, nextVersion, 'coming_soon', createdAt, input.packaging.trim())
    const packagingSpecs: PackagingSpec[] = sourceSpecs.map((spec, i) => ({
      ...spec,
      id: `spec-${product.id}-${compact}-${i + 1}`,
      technicalDoc: {
        ...spec.technicalDoc,
        id: `spec-${product.id}-${compact}-${i + 1}-doc`,
        code: `HSKT-${product.code}-${compact}-${String(i + 1).padStart(2, '0')}`,
        status: 'draft',
        verified: false,
        updatedAt: createdAt,
      },
    }))

    const created = await versionsDb.create({
      ...stripId(base),
      version: nextVersion,
      basedOnVersion: base.version,
      stage: 'coming_soon',
      approvalStatus: 'processing',
      assignedRole: roleScope.primary,
      collaboratorRoles: roleScope.collaborators,
      assignedAt: createdAt,
      approverRole: 'ra',
      effectiveDate: input.effectiveDate,
      effectiveEndDate: input.endDate,
      indefinite: input.indefinite ?? false,
      updatedAt: createdAt,
      summary: input.summary.trim(),
      changeNote: input.summary.trim(),
      signedAt: undefined,
      appliedAt: undefined,
      processedByRole: undefined,
      processedAt: undefined,
      approvedByRole: undefined,
      rejectedByRole: undefined,
      rejectedReason: undefined,
      rejectedAt: undefined,
      changes: allChanges,
      activeIngredients: input.activeIngredients.trim(),
      dosageFormId: input.dosageFormId,
      categoryId: input.categoryId,
      packaging: input.packaging.trim(),
      shelfLife: input.shelfLife.trim(),
      regulation: input.regulation.trim(),
      manufacturer: input.manufacturer.trim(),
      manufacturingMethod: input.manufacturingMethod.trim(),
      approvalNo: `QĐ-${product.code}-${nextVersion}`,
      approvedBy: `Hồ sơ mới – chờ ${roleMeta(roleScope.primary).name} xử lý`,
      packagingSpecs,
      extraDocs: (input.extraDocs ?? []).map((doc) => ({ ...doc, status: 'draft', verified: false })),
    })
    logHistory({ ...product, version: created.version }, 'updated', `Tạo phiên bản ${created.version} – gửi ${roleMeta(roleScope.primary).name} xử lý`)
    return created
  },

  savePackagingSpecs: async (productId: number, versionId: number, specs: PackagingSpec[]): Promise<ProductVersion> => {
    if (!env.useMock) {
      return http.put<ProductVersion>(`${endpoints.products}/${productId}/versions/${versionId}/packaging-specs`, { specs })
    }
    const target = versionsDb.snapshot().find((v) => v.id === versionId && v.productId === productId)
    if (!target) throw mockError('Không tìm thấy phiên bản.', 404)
    if (target.stage === 'archived') throw mockError('Phiên bản lưu trữ chỉ được xem, không thể chỉnh sửa quy cách đóng gói.', 409)
    return versionsDb.patch(versionId, { packagingSpecs: specs })
  },

  /** Cập nhật thông tin chung của phiên bản. Số đăng ký không được thay đổi. */
  updateInfo: async (productId: number, versionId: number, input: UpdateVersionInfoInput): Promise<ProductVersion> => {
    if (!env.useMock) return http.put<ProductVersion>(`${endpoints.products}/${productId}/versions/${versionId}`, input)
    const product = requireProduct(productId)
    const target = versionsDb.snapshot().find((v) => v.id === versionId && v.productId === productId)
    if (!target) throw mockError('Không tìm thấy phiên bản.', 404)
    if (target.stage === 'archived') throw mockError('Phiên bản lưu trữ chỉ được xem, không thể chỉnh sửa.', 409)

    const nextVersion = input.version.trim()
    const duplicated = versionsDb.snapshot().some(
      (v) => v.productId === productId && v.id !== versionId && v.version.trim().toLowerCase() === nextVersion.toLowerCase(),
    )
    if (duplicated) throw mockError(`Phiên bản ${nextVersion} đã tồn tại.`, 409)

    const updated = versionsDb.patch(versionId, applyVersionInfo(target, input, product.code, now()))

    if (target.stage === 'current') {
      const productUpdated = productsDb.patch(productId, {
        version: nextVersion,
        activeIngredients: input.activeIngredients.trim(),
        packaging: input.packaging.trim(),
        shelfLife: input.shelfLife.trim(),
        regulation: input.regulation.trim(),
        dosageFormId: input.dosageFormId,
        categoryId: input.categoryId,
        updatedAt: now(),
      })
      logHistory(productUpdated, 'updated', `Cập nhật thông tin phiên bản ${nextVersion}`)
    } else {
      logHistory({ ...product, version: nextVersion }, 'updated', `Cập nhật thông tin phiên bản ${nextVersion}`)
    }
    return updated
  },

  /** Lưu danh sách tài liệu tải lên của phiên bản (pháp lý, chuyên môn, HDSD dùng chung). */
  saveExtraDocs: async (productId: number, versionId: number, docs: VersionDocument[]): Promise<ProductVersion> => {
    if (!env.useMock) {
      return http.put<ProductVersion>(`${endpoints.products}/${productId}/versions/${versionId}/documents`, { docs })
    }
    const target = versionsDb.snapshot().find((v) => v.id === versionId && v.productId === productId)
    if (!target) throw mockError('Không tìm thấy phiên bản.', 404)
    if (target.stage === 'archived') throw mockError('Phiên bản lưu trữ chỉ được xem, không thể thêm tài liệu.', 409)
    return versionsDb.patch(versionId, { extraDocs: docs })
  },

  /**
   * Duyệt hồ sơ theo vai trò hiện tại:
   * - processing → tổ phụ trách duyệt, hồ sơ chuyển sang pending (Chờ duyệt).
   * - pending → Tổ ĐK Thuốc phê duyệt cuối, hồ sơ chuyển approved và ký xác thực.
   */
  approve: async (productId: number, versionId: number, role: RoleKey): Promise<ProductVersion> => {
    if (!env.useMock) {
      return http.put<ProductVersion>(`${endpoints.products}/${productId}/versions/${versionId}/approve`, { role })
    }
    const product = requireProduct(productId)
    const target = versionsDb.snapshot().find((v) => v.id === versionId && v.productId === productId)
    if (!target) throw mockError('Không tìm thấy phiên bản.', 404)
    if (target.stage !== 'coming_soon') throw mockError('Chỉ phiên bản đang chờ mới có thể phê duyệt.', 409)
    if (!canRoleAct(target, role)) {
      throw mockError(`${roleMeta(role).name} không phụ trách bước xử lý hiện tại của hồ sơ này.`, 403)
    }

    const status = approvalStatusOf(target)
    const at = now()

    if (status === 'processing') {
      const updated = versionsDb.patch(versionId, {
        approvalStatus: 'pending',
        processedByRole: role,
        processedAt: at,
        updatedAt: at,
        approvedBy: `Đã xử lý – chờ ${roleMeta(approverRoleOf(target)).name} phê duyệt`,
      })
      logHistory({ ...product, version: target.version }, 'updated', `${roleMeta(role).name} duyệt phiên bản ${target.version}`)
      return updated
    }

    const updated = versionsDb.patch(versionId, {
      approvalStatus: 'approved',
      approvedByRole: role,
      approvedBy: `${roleMeta(role).name} – Công ty CP Dược phẩm OPC`,
      updatedAt: at,
      ...docsSignedPatch(target),
    })
    logHistory({ ...product, version: target.version }, 'updated', `${roleMeta(role).name} phê duyệt cuối phiên bản ${target.version}`)
    return updated
  },

  /** Từ chối hồ sơ kèm lý do; chỉ vai trò đang phụ trách bước hiện tại mới thực hiện được. */
  reject: async (productId: number, versionId: number, reason: string, role: RoleKey): Promise<ProductVersion> => {
    if (!env.useMock) {
      return http.put<ProductVersion>(`${endpoints.products}/${productId}/versions/${versionId}/reject`, { reason, role })
    }
    const product = requireProduct(productId)
    const target = versionsDb.snapshot().find((v) => v.id === versionId && v.productId === productId)
    if (!target) throw mockError('Không tìm thấy phiên bản.', 404)
    if (target.stage !== 'coming_soon') throw mockError('Chỉ phiên bản đang chờ duyệt mới có thể từ chối.', 409)
    if (!canRoleAct(target, role)) {
      throw mockError(`${roleMeta(role).name} không phụ trách bước xử lý hiện tại của hồ sơ này.`, 403)
    }
    const note = reason.trim()
    if (!note) throw mockError('Vui lòng nhập lý do từ chối.', 400)

    const at = now()
    const updated = versionsDb.patch(versionId, {
      approvalStatus: 'rejected',
      rejectedByRole: role,
      rejectedReason: note,
      rejectedAt: at,
      updatedAt: at,
      approvedBy: `${roleMeta(role).name} từ chối hồ sơ`,
    })
    logHistory({ ...product, version: target.version }, 'updated', `${roleMeta(role).name} từ chối phiên bản ${target.version}: ${note}`)
    return updated
  },

  /** Cập nhật xong hồ sơ bị từ chối và gửi lại tổ phụ trách xử lý. */
  resubmit: async (productId: number, versionId: number, role: RoleKey): Promise<ProductVersion> => {
    if (!env.useMock) {
      return http.put<ProductVersion>(`${endpoints.products}/${productId}/versions/${versionId}/resubmit`, { role })
    }
    const product = requireProduct(productId)
    const target = versionsDb.snapshot().find((v) => v.id === versionId && v.productId === productId)
    if (!target) throw mockError('Không tìm thấy phiên bản.', 404)
    if (!canRoleResubmit(target, role)) {
      throw mockError('Hồ sơ chưa bị từ chối hoặc vai trò hiện tại không được gửi lại.', 409)
    }

    const assignedRole = target.assignedRole
      ?? inferRoleScope(target.changes, target.extraDocs?.map((doc) => doc.group)).primary
    const at = now()
    const updated = versionsDb.patch(versionId, {
      approvalStatus: 'processing',
      assignedRole,
      assignedAt: at,
      processedByRole: undefined,
      processedAt: undefined,
      approvedByRole: undefined,
      rejectedByRole: undefined,
      rejectedReason: undefined,
      rejectedAt: undefined,
      updatedAt: at,
      approvedBy: `Hồ sơ gửi lại – chờ ${roleMeta(assignedRole).name} xử lý`,
    })
    logHistory({ ...product, version: target.version }, 'updated', `Gửi lại phiên bản ${target.version} tới ${roleMeta(assignedRole).name}`)
    return updated
  },

  /** Bật/tắt hiệu lực vô thời hạn cho phiên bản. */
  setIndefinite: async (productId: number, versionId: number, indefinite: boolean): Promise<ProductVersion> => {
    if (!env.useMock) {
      return http.put<ProductVersion>(`${endpoints.products}/${productId}/versions/${versionId}/indefinite`, { indefinite })
    }
    const target = versionsDb.snapshot().find((v) => v.id === versionId && v.productId === productId)
    if (!target) throw mockError('Không tìm thấy phiên bản.', 404)
    if (target.stage === 'archived') throw mockError('Phiên bản lưu trữ chỉ được xem.', 409)
    return versionsDb.patch(versionId, { indefinite, updatedAt: now() })
  },

  /** Áp dụng ngay: Tổ ĐK Thuốc đưa phiên bản đã duyệt vào lưu hành với ngày hiệu lực hôm nay. */
  applyNow: async (productId: number, versionId: number, role: RoleKey): Promise<ProductVersion> => {
    if (!env.useMock) {
      return http.put<ProductVersion>(`${endpoints.products}/${productId}/versions/${versionId}/apply-now`, { role })
    }
    if (role !== 'ra') throw mockError('Chỉ Tổ ĐK Thuốc được áp dụng phiên bản vào lưu hành.', 403)
    const target = versionsDb.snapshot().find((v) => v.id === versionId && v.productId === productId)
    if (!target) throw mockError('Không tìm thấy phiên bản.', 404)
    if (target.stage !== 'coming_soon') throw mockError('Phiên bản không ở trạng thái chờ áp dụng.', 409)
    if (approvalStatusOf(target) !== 'approved') {
      throw mockError('Phiên bản cần hoàn tất phê duyệt trước khi áp dụng.', 409)
    }
    return applyActivation(productId, target, today())
  },

  activate: async (productId: number, versionId: number, role: RoleKey): Promise<ProductVersion> => {
    if (!env.useMock) return http.put<ProductVersion>(`${endpoints.products}/${productId}/versions/${versionId}/activate`, { role })
    if (role !== 'ra') throw mockError('Chỉ Tổ ĐK Thuốc được đưa phiên bản vào lưu hành.', 403)
    const target = versionsDb.snapshot().find((v) => v.id === versionId && v.productId === productId)
    if (!target) throw mockError('Không tìm thấy phiên bản.', 404)
    if (target.stage !== 'coming_soon') throw mockError('Chỉ phiên bản đang chờ mới có thể đưa vào sử dụng.', 409)
    if (approvalStatusOf(target) !== 'approved') {
      throw mockError('Phiên bản chưa hoàn tất phê duyệt.', 409)
    }
    if (!isVersionDue(target)) {
      throw mockError(`Chưa tới ngày áp dụng (${formatDate(target.effectiveDate)}). Chưa thể đưa phiên bản vào sử dụng.`, 409)
    }
    return applyActivation(productId, target, today())
  },
}
