import { describe, it, expect } from 'vitest'
import { serializeJsonLd } from '@/components/JsonLd'

describe('serializeJsonLd', () => {
  it('cannot be used to break out of the <script> element', () => {
    const payload = { name: '</script><script>alert(1)</script> & <b>' }
    const out = serializeJsonLd(payload)
    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
    expect(out).not.toContain('&')
    expect(JSON.parse(out)).toEqual(payload)
  })

  it('escapes JS line separators but keeps the data identical', () => {
    const payload = { name: `a${String.fromCharCode(0x2028)}b${String.fromCharCode(0x2029)}c` }
    const out = serializeJsonLd(payload)
    expect(out).not.toContain(String.fromCharCode(0x2028))
    expect(out).not.toContain(String.fromCharCode(0x2029))
    expect(JSON.parse(out)).toEqual(payload)
  })
})
