import { describe, it, expect } from 'vitest'
import {
  MAX_DOCUMENT_BYTES,
  MAX_IMAGE_BYTES,
  checkFile,
  excerpt,
  formatBytes,
  isOwnBlobUpload,
  safeFileName,
  uploadPrefixFor,
} from '@/lib/blog'
import { blogPostInputSchema, blogReportInputSchema } from '@/lib/validation'

const BLOB = 'https://abc123.public.blob.vercel-storage.com'

describe('checkFile', () => {
  it('accepts images up to 5 MB and documents up to 10 MB', () => {
    expect(checkFile('image/png', MAX_IMAGE_BYTES)).toEqual({ ok: true })
    expect(checkFile('application/pdf', MAX_DOCUMENT_BYTES)).toEqual({ ok: true })
  })

  it('rejects oversized files per type', () => {
    expect(checkFile('image/jpeg', MAX_IMAGE_BYTES + 1)).toEqual({ ok: false, reason: 'size' })
    expect(checkFile('application/pdf', MAX_DOCUMENT_BYTES + 1)).toEqual({ ok: false, reason: 'size' })
    expect(checkFile('image/png', 0)).toEqual({ ok: false, reason: 'size' })
  })

  it('rejects dangerous or unknown types', () => {
    for (const type of ['image/svg+xml', 'text/html', 'application/zip', 'application/x-msdownload', '']) {
      expect(checkFile(type, 100)).toEqual({ ok: false, reason: 'type' })
    }
  })
})

describe('isOwnBlobUpload', () => {
  const userId = 'user123'
  const pathname = `${uploadPrefixFor(userId)}photo-AbC123.png`

  it('accepts a public blob in the member’s own folder', () => {
    expect(isOwnBlobUpload(`${BLOB}/${pathname}`, pathname, userId)).toBe(true)
  })

  it('rejects another member’s folder', () => {
    const other = 'blog/someoneElse/photo.png'
    expect(isOwnBlobUpload(`${BLOB}/${other}`, other, userId)).toBe(false)
  })

  it('rejects a URL whose path does not match the pathname', () => {
    expect(isOwnBlobUpload(`${BLOB}/blog/someoneElse/photo.png`, pathname, userId)).toBe(false)
  })

  it('rejects external hosts, http and malformed URLs', () => {
    expect(isOwnBlobUpload(`https://evil.example.com/${pathname}`, pathname, userId)).toBe(false)
    expect(isOwnBlobUpload(`https://public.blob.vercel-storage.com.evil.com/${pathname}`, pathname, userId)).toBe(false)
    expect(isOwnBlobUpload(`http://abc123.public.blob.vercel-storage.com/${pathname}`, pathname, userId)).toBe(false)
    expect(isOwnBlobUpload('not a url', pathname, userId)).toBe(false)
  })

  it('rejects path traversal', () => {
    const sneaky = `${uploadPrefixFor(userId)}../other/file.png`
    expect(isOwnBlobUpload(`${BLOB}/${sneaky}`, sneaky, userId)).toBe(false)
  })
})

describe('safeFileName', () => {
  it('keeps a readable, safe name with its extension', () => {
    expect(safeFileName('Übung 1 (Dativ).pdf')).toBe('Ubung-1-Dativ-.pdf')
    expect(safeFileName('../../etc/passwd')).toBe('etc-passwd')
    expect(safeFileName('???')).toBe('file')
  })
})

describe('excerpt / formatBytes', () => {
  it('shortens long text at a word boundary', () => {
    const text = 'wort '.repeat(100)
    const result = excerpt(text, 20)
    expect(result.length).toBeLessThanOrEqual(21)
    expect(result.endsWith('…')).toBe(true)
  })

  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('blog validation', () => {
  it('requires a meaningful title and body', () => {
    expect(blogPostInputSchema.safeParse({ title: 'Hi', body: 'short' }).success).toBe(false)
    const ok = blogPostInputSchema.safeParse({ title: 'Wann Dativ?', body: 'Ich verstehe den Dativ nicht.' })
    expect(ok.success).toBe(true)
    expect(ok.success && ok.data.attachments).toEqual([])
  })

  it('allows at most five attachments', () => {
    const attachment = { url: `${BLOB}/a.png`, pathname: 'a.png', contentType: 'image/png', size: 10, fileName: 'a.png' }
    const result = blogPostInputSchema.safeParse({
      title: 'Viele Bilder',
      body: 'Hier sind meine Bilder.',
      attachments: Array(6).fill(attachment),
    })
    expect(result.success).toBe(false)
  })

  it('reports exactly one target', () => {
    expect(blogReportInputSchema.safeParse({ postId: 'p', reason: 'spam' }).success).toBe(true)
    expect(blogReportInputSchema.safeParse({ answerId: 'a', reason: 'spam' }).success).toBe(true)
    expect(blogReportInputSchema.safeParse({ postId: 'p', answerId: 'a', reason: 'spam' }).success).toBe(false)
    expect(blogReportInputSchema.safeParse({ reason: 'spam' }).success).toBe(false)
  })
})
