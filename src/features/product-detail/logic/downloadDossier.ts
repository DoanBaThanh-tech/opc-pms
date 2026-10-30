import type { Product } from '@/features/products/logic/types'
import { getMediaBlob } from '@/core/media/cloudMedia'
import { downloadBlob, downloadHtml, fileSlug } from '@/core/utils/download'
import { blobToDataUrl } from '@/core/utils/image'
import { buildDossierHtml } from './dossierHtml'
import { buildDocumentHtml } from './documentHtml'
import { docsByGroup } from './documents'
import type { HtmlContext } from './htmlShared'
import { getLogoDataUrl } from './logo'
import { resolvePackagingSpecs } from './packagingSpecs'
import type { ProductVersion, VersionDocument } from './types'

export interface DossierArgs {
  product: Product
  version: ProductVersion
  previous?: ProductVersion
  docs: VersionDocument[]
  versions: ProductVersion[]
  names: { dosage: string; category: string }
}

async function toContext(args: DossierArgs): Promise<HtmlContext> {
  return { ...args, logoSrc: await getLogoDataUrl() }
}

const baseName = (p: Product, v: ProductVersion) => `OPC_${fileSlug(p.code)}_v${fileSlug(v.version)}`

/** Tải 1 tài liệu dưới dạng HTML in được (mở file → In/Lưu PDF). */
export async function downloadSingleDocument(args: DossierArgs, doc: VersionDocument) {
  const ctx = await toContext(args)
  downloadHtml(`${baseName(args.product, args.version)}_${fileSlug(doc.name)}.html`, buildDocumentHtml(ctx, doc))
}

const FOLDER: Record<VersionDocument['group'], string> = {
  legal: '01-phap-ly',
  usage: '02-huong-dan-su-dung',
  packaging: '03-quy-cach-ky-thuat',
  professional: '04-ho-so-chuyen-mon',
}

/** Tải toàn bộ hồ sơ của phiên bản: HTML tổng quan + từng tài liệu + JSON đầy đủ, đóng gói ZIP. */
export async function downloadVersionDossier(args: DossierArgs) {
  const ctx = await toContext(args)
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const root = zip.folder(`OPC_ho-so_${args.product.code}_v${args.version.version}`)!
  const specs = resolvePackagingSpecs(args.product, args.version)

  // Ảnh chỉ lưu ID trong DB; khi xuất hồ sơ mới tải nội dung từ cloud về nhúng vào HTML/ZIP.
  const photoSrc: Record<string, string> = {}
  const photoFiles: { name: string; base64: string }[] = []
  for (let i = 0; i < specs.length; i++) {
    const photo = specs[i].photo
    if (!photo) continue
    let dataUrl = photo.url?.startsWith('data:image/') ? photo.url : ''
    if (!dataUrl) {
      const blob = await getMediaBlob(photo)
      if (blob) dataUrl = await blobToDataUrl(blob)
    }
    if (dataUrl) {
      if (photo.id) photoSrc[photo.id] = dataUrl
      const match = dataUrl.match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i)
      if (match) {
        const ext = match[1].toLowerCase().replace('jpeg', 'jpg')
        photoFiles.push({ name: `${String(i + 1).padStart(2, '0')}-${fileSlug(specs[i].name)}.${ext}`, base64: match[2] })
      }
    } else if (photo.url && photo.id) {
      photoSrc[photo.id] = photo.url
    }
  }

  root.file('00-tong-quan.html', buildDossierHtml(ctx, photoSrc))
  root.file('du-lieu-day-du.json', JSON.stringify({
    exportedAt: new Date().toISOString(),
    product: args.product,
    version: args.version,
    documents: args.docs,
    allVersions: args.versions,
  }, null, 2))

  for (const group of ['legal', 'usage', 'packaging', 'professional'] as const) {
    const folder = root.folder(FOLDER[group])!
    docsByGroup(args.docs, group)
      .filter((doc) => !(group === 'usage' && doc.shared))
      .forEach((doc, i) => {
        folder.file(`${String(i + 1).padStart(2, '0')}-${fileSlug(doc.name)}.html`, buildDocumentHtml(ctx, doc))
      })
  }

  const sharedUsage = args.docs.filter((doc) => doc.group === 'usage' && doc.shared)
  if (sharedUsage.length) {
    const folder = root.folder('04-ho-so-chuyen-mon/hdsd-dung-chung')!
    sharedUsage.forEach((doc, i) => {
      folder.file(`${String(i + 1).padStart(2, '0')}-${fileSlug(doc.name)}.html`, buildDocumentHtml(ctx, doc))
    })
  }

  if (photoFiles.length) {
    const photoFolder = root.folder('03-quy-cach-ky-thuat/anh-chup')!
    photoFiles.forEach((file) => photoFolder.file(file.name, file.base64, { base64: true }))
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  downloadBlob(`${baseName(args.product, args.version)}_ho-so-day-du.zip`, blob)
}
