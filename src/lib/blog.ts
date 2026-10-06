/**
 * Community blog (Q&A) rules shared by the upload route, the post API and the
 * client form. Pure and DB-free so the rules can be unit-tested and imported
 * from client components.
 */

export const BLOG_PAGE_SIZE = 20
export const MAX_ATTACHMENTS_PER_POST = 5

const MB = 1024 * 1024

/** Inline-displayable images. */
export const IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const MAX_IMAGE_BYTES = 5 * MB

/** Downloadable documents (no executables, archives or HTML/SVG). */
export const DOCUMENT_CONTENT_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
] as const
export const MAX_DOCUMENT_BYTES = 10 * MB

export const ALLOWED_CONTENT_TYPES: readonly string[] = [...IMAGE_CONTENT_TYPES, ...DOCUMENT_CONTENT_TYPES]

/** Hard ceiling enforced by the Blob client token (largest allowed type). */
export const MAX_UPLOAD_BYTES = Math.max(MAX_IMAGE_BYTES, MAX_DOCUMENT_BYTES)

/** Value for an <input type="file" accept="..."> attribute. */
export const FILE_INPUT_ACCEPT = [...ALLOWED_CONTENT_TYPES, '.pdf', '.txt', '.doc', '.docx'].join(',')

export function isImageContentType(contentType: string): boolean {
  return (IMAGE_CONTENT_TYPES as readonly string[]).includes(contentType)
}

export function maxBytesFor(contentType: string): number | null {
  if (isImageContentType(contentType)) return MAX_IMAGE_BYTES
  if ((DOCUMENT_CONTENT_TYPES as readonly string[]).includes(contentType)) return MAX_DOCUMENT_BYTES
  return null
}

export type FileCheck = { ok: true } | { ok: false; reason: 'type' | 'size' }

/** Validate a file's type and size against the per-type limits. */
export function checkFile(contentType: string, size: number): FileCheck {
  const max = maxBytesFor(contentType)
  if (max === null) return { ok: false, reason: 'type' }
  if (size <= 0 || size > max) return { ok: false, reason: 'size' }
  return { ok: true }
}

/** Every upload of a user lives under this Blob folder. */
export function uploadPrefixFor(userId: string): string {
  return `blog/${userId}/`
}

/**
 * Turn a user-supplied file name into a safe Blob path segment: ASCII letters,
 * digits, dot, dash and underscore only; keeps the extension readable.
 */
export function safeFileName(name: string): string {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(-80)
  return cleaned || 'file'
}

const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com'

/**
 * True when `url` is a public Vercel Blob URL whose path is exactly `pathname`
 * and that pathname sits in the given user's upload folder. This stops a member
 * from attaching blobs uploaded by somebody else, or arbitrary external URLs.
 */
export function isOwnBlobUpload(url: string, pathname: string, userId: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith(BLOB_HOST_SUFFIX)) return false
  if (!pathname.startsWith(uploadPrefixFor(userId)) || pathname.includes('..')) return false
  return decodeURIComponent(parsed.pathname) === `/${pathname}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / MB).toFixed(1)} MB`
}

/** Short plain-text preview of a post body for lists and meta descriptions. */
export function excerpt(body: string, maxLength = 180): string {
  const plain = body.replace(/\s+/g, ' ').trim()
  if (plain.length <= maxLength) return plain
  const cut = plain.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim()}…`
}
