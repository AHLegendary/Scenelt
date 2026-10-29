import { describe, it, expect } from 'vitest'
import { getLeaderboard, getMyList, PERIODS } from '../../src/lib/localStore.js'

function fakeStorage(value) {
  return { getItem: () => value }
}

describe('getLeaderboard', () => {
  it('returns rows for every period with ranks starting at 1', () => {
    for (const period of PERIODS) {
      const rows = getLeaderboard(period)
      expect(rows.length).toBeGreaterThan(0)
      expect(rows.map((r) => r.rank)).toEqual(rows.map((_, i) => i + 1))
    }
  })

  it('orders highest-ranked by score, descending', () => {
    const scores = getLeaderboard('weekly', 'highest').map((r) => r.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('orders most-watched by number of rankers, descending', () => {
    const counts = getLeaderboard('monthly', 'watched').map((r) => r.rankers)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
  })

  it('throws on an unknown period', () => {
    expect(() => getLeaderboard('yearly')).toThrow()
  })
})

describe('getMyList', () => {
  it('is empty when nothing is stored', () => {
    expect(getMyList(fakeStorage(null))).toEqual([])
  })

  it('returns the stored list', () => {
    const list = [{ id: 1, title: 'Whiplash' }]
    expect(getMyList(fakeStorage(JSON.stringify(list)))).toEqual(list)
  })

  it('falls back to empty on corrupt or non-list data', () => {
    expect(getMyList(fakeStorage('{not json'))).toEqual([])
    expect(getMyList(fakeStorage('{"a":1}'))).toEqual([])
  })

  it('falls back to empty when storage is unavailable', () => {
    expect(getMyList(null)).toEqual([])
  })
})
