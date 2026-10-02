import { Link } from '@/i18n/navigation'
import type { BreadcrumbItem } from '@/lib/seo'

/**
 * Visible breadcrumb trail for educational pages. The matching
 * BreadcrumbList JSON-LD is emitted separately via {@link breadcrumbJsonLd}
 * so the visible hierarchy and the structured data stay in sync.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={item.path} className="flex items-center gap-1">
              {isLast ? (
                <span aria-current="page" className="text-gray-700">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link href={item.path} className="underline hover:text-gray-900">
                    {item.name}
                  </Link>
                  <span aria-hidden="true">›</span>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
