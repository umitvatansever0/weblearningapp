import { describe, it, expect } from 'vitest'
import de from '../../messages/de.json'
import en from '../../messages/en.json'
import tr from '../../messages/tr.json'

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return typeof value === 'object' && value !== null
      ? flattenKeys(value as Record<string, unknown>, fullKey)
      : [fullKey]
  })
}

describe('translation messages', () => {
  it('has the same keys in de, en, and tr', () => {
    const deKeys = flattenKeys(de).sort()
    const enKeys = flattenKeys(en).sort()
    const trKeys = flattenKeys(tr).sort()

    expect(deKeys).toEqual(enKeys)
    expect(trKeys).toEqual(enKeys)
  })
})
