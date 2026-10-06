'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { upload } from '@vercel/blob/client'
import { useRouter } from '@/i18n/navigation'
import {
  FILE_INPUT_ACCEPT,
  MAX_ATTACHMENTS_PER_POST,
  checkFile,
  formatBytes,
  safeFileName,
  uploadPrefixFor,
} from '@/lib/blog'

interface UploadedFile {
  url: string
  pathname: string
  contentType: string
  size: number
  fileName: string
}

interface FileEntry {
  key: string
  name: string
  size: number
  percent: number
  status: 'uploading' | 'done' | 'error'
  result?: UploadedFile
}

export function BlogPostForm({ userId }: { userId: string }) {
  const t = useTranslations('blog')
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<FileEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const uploading = files.some((file) => file.status === 'uploading')

  function updateFile(key: string, patch: Partial<FileEntry>) {
    setFiles((current) => current.map((file) => (file.key === key ? { ...file, ...patch } : file)))
  }

  async function uploadFile(file: File, key: string) {
    try {
      const blob = await upload(`${uploadPrefixFor(userId)}${safeFileName(file.name)}`, file, {
        access: 'public',
        handleUploadUrl: '/api/blog/upload',
        contentType: file.type,
        onUploadProgress: ({ percentage }) => updateFile(key, { percent: Math.round(percentage) }),
      })
      updateFile(key, {
        status: 'done',
        percent: 100,
        result: {
          url: blob.url,
          pathname: blob.pathname,
          contentType: file.type,
          size: file.size,
          fileName: file.name,
        },
      })
    } catch {
      updateFile(key, { status: 'error' })
      setError(t('errorUpload', { name: file.name }))
    }
  }

  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    const room = MAX_ATTACHMENTS_PER_POST - files.filter((file) => file.status !== 'error').length
    if (selected.length > room) {
      setError(t('errorTooManyFiles', { max: MAX_ATTACHMENTS_PER_POST }))
    }
    for (const file of selected.slice(0, Math.max(0, room))) {
      const check = checkFile(file.type, file.size)
      if (!check.ok) {
        setError(t(check.reason === 'type' ? 'errorFileType' : 'errorFileSize', { name: file.name }))
        continue
      }
      const key = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`
      setFiles((current) => [...current, { key, name: file.name, size: file.size, percent: 0, status: 'uploading' }])
      void uploadFile(file, key)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (uploading) return
    setError(null)
    setSubmitting(true)

    const attachments = files.flatMap((file) => (file.status === 'done' && file.result ? [file.result] : []))
    const res = await fetch('/api/blog/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, attachments }),
    })
    const data = await res.json().catch(() => null)
    setSubmitting(false)

    if (!res.ok) {
      setError(data?.error ?? t('errorGeneric'))
      return
    }
    router.push(`/blog/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        {t('titleLabel')}
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('titlePlaceholder')}
          required
          minLength={5}
          maxLength={150}
          className="border rounded px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        {t('bodyLabel')}
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t('bodyPlaceholder')}
          required
          minLength={10}
          maxLength={10000}
          rows={8}
          className="border rounded px-2 py-1"
        />
      </label>

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          {t('filesLabel')}
          <input
            type="file"
            multiple
            accept={FILE_INPUT_ACCEPT}
            onChange={handleFiles}
            disabled={files.filter((file) => file.status !== 'error').length >= MAX_ATTACHMENTS_PER_POST}
            className="text-sm"
          />
        </label>
        <p className="text-xs text-gray-500">{t('filesHint', { max: MAX_ATTACHMENTS_PER_POST })}</p>
        {files.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {files.map((file) => (
              <li key={file.key} className="flex items-center justify-between gap-2 border rounded px-2 py-1">
                <span className={file.status === 'error' ? 'text-red-600' : ''}>
                  {file.status === 'uploading'
                    ? t('uploading', { name: file.name, percent: file.percent })
                    : `${file.name} (${formatBytes(file.size)})`}
                </span>
                {file.status !== 'uploading' && (
                  <button
                    type="button"
                    onClick={() => setFiles((current) => current.filter((entry) => entry.key !== file.key))}
                    className="text-xs underline"
                  >
                    {t('removeFile')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-500">{t('guidelines')}</p>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={submitting || uploading}
        className="bg-gray-900 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {submitting ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
