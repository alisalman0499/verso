import { describe, expect, it } from 'vitest'
import { returnPathFrom } from './returnPath'

describe('returnPathFrom', () => {
  it('returns the path a link came from', () => {
    expect(returnPathFrom({ from: '/lists/upcoming' })).toBe('/lists/upcoming')
    expect(returnPathFrom({ from: '/' })).toBe('/')
  })

  it.each([
    ['no state', undefined],
    ['null', null],
    ['a missing from', {}],
    ['a non-string from', { from: 42 }],
    ['a relative path', { from: 'tasks' }],
    ['another site', { from: 'https://evil.example' }],
    ['a protocol-relative URL', { from: '//evil.example' }],
  ])('falls back for %s', (_label, state) => {
    expect(returnPathFrom(state)).toBe('/')
  })

  it('uses the given fallback', () => {
    expect(returnPathFrom(undefined, '/lists/all')).toBe('/lists/all')
  })
})
