import { describe, expect, it } from 'vitest'
import {
  monthBounds,
  monthKeyFromDateString,
  previousMonthKey,
} from '../../src/lib/monthBounds.js'

describe('monthBounds (unit)', () => {
  it('returns start and end for a valid month', () => {
    expect(monthBounds('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' })
  })

  it('handles 31-day months', () => {
    expect(monthBounds('2026-01')).toEqual({ start: '2026-01-01', end: '2026-01-31' })
  })

  it('returns null for invalid month', () => {
    expect(monthBounds('2026-13')).toBeNull()
    expect(monthBounds('bad')).toBeNull()
  })
})

describe('monthKeyFromDateString (unit)', () => {
  it('extracts YYYY-MM from date string', () => {
    expect(monthKeyFromDateString('2026-05-20')).toBe('2026-05')
  })

  it('returns null for short strings', () => {
    expect(monthKeyFromDateString('2026')).toBeNull()
  })
})

describe('previousMonthKey (unit)', () => {
  it('returns previous calendar month', () => {
    expect(previousMonthKey(new Date('2026-03-15'))).toBe('2026-02')
  })

  it('rolls back across year boundary', () => {
    expect(previousMonthKey(new Date('2026-01-10'))).toBe('2025-12')
  })
})
