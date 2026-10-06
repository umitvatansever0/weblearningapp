/**
 * Serialize structured data for an inline <script> block. JSON.stringify does
 * not escape "<", so a value containing "</script>" (e.g. a user-written blog
 * title) would close the tag and inject HTML/JS. Escaping <, > and & as
 * unicode escapes keeps the JSON identical for parsers and makes breaking out
 * of the script element impossible; U+2028/U+2029 are escaped for old JS
 * engines.
 */
const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), 'g')
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), 'g')

export function serializeJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATOR, '\\u2028')
    .replace(PARAGRAPH_SEPARATOR, '\\u2029')
}

/**
 * Renders a JSON-LD structured-data block in the server-rendered HTML.
 * Accepts one object or an array of objects (each gets its own <script>).
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const blocks = Array.isArray(data) ? data : [data]
  return (
    <>
      {blocks.map((block, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }}
        />
      ))}
    </>
  )
}
