import type { Metadata } from 'next'
import { NOINDEX_METADATA } from '@/lib/seo'

// Login / register / password-reset flows must never be indexed.
export const metadata: Metadata = NOINDEX_METADATA

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
