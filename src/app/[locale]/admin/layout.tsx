import type { Metadata } from 'next'
import { NOINDEX_METADATA } from '@/lib/seo'

// Admin area is authenticated-only and must never be indexed.
export const metadata: Metadata = NOINDEX_METADATA

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
