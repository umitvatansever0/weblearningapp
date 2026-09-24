import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Renders trusted first-party markdown (lesson explanations from the seed)
// as React elements — no raw HTML injection, so it stays within the app's
// strict CSP. remark-gfm adds table support.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-3 text-gray-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className="text-xl font-bold">{children}</h2>,
          h2: ({ children }) => <h2 className="text-xl font-bold">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold">{children}</h3>,
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 flex flex-col gap-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 flex flex-col gap-1">{children}</ol>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-3 py-1 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-3 py-1">{children}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
