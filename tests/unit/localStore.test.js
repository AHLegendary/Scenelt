import { describe, it, expect } from 'vitest'
import MOVIES from '../../src/data/movies.json'
import { LEADERBOARD } from '../../src/data/leaderboard.js'
import {
  addMovie,
  getLeaderboard,
  getMovie,
  getMyList,
  isInList,
  PERIODS,
  posterUrl,
  removeMovie,
  searchMovies,
  subscribe,
} from '../../src/lib/localStore.js'

// In-memory stand-in for localStorage.
function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v) },
  }
}

const ids = (movies) => movies.map((m) => m.id)

describe('movie catalog', () => {
  it('has unique ids', () => {
    expect(new Set(ids(MOVIES)).size).toBe(MOVIES.length)
  })

  it('has every leaderboard movie', () => {
    for (const period of PERIODS) {
      for (const row of LEADERBOARD[period]) expect(getMovie(row.movieId)).not.toBeNull()
    }
  })

  it('builds TMDb poster URLs only when a poster path exists', () => {
    expect(posterUrl({ poster_path: '/abc.jpg' }, 'w154')).toBe('https://image.tmdb.org/t/p/w154/abc.jpg')
    expect(posterUrl({ poster_path: null })).toBeNull()
  })
})

describe('getLeaderboard', () => {
  it('returns rows for every period with ranks starting at 1', () => {
    for (const period of PERIODS) {
      const rows = getLeaderboard(period)
      expect(rows.length).toBeGreaterThan(0)
      expect(rows.map((r) => r.rank)).toEqual(rows.map((_, i) => i + 1))
      expect(rows.every((r) => r.title)).toBe(true)
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

describe('searchMovies', () => {
  it('returns nothing for an empty query', () => {
    expect(searchMovies('   ')).toEqual([])
  })

  it('is case-insensitive', () => {
    expect(ids(searchMovies('WHIPLASH'))).toEqual(['whiplash-2014'])
  })

  it('ignores accents', () => {
    expect(ids(searchMovies('amelie'))).toContain('amelie-2001')
  })

  it('puts title-prefix matches before mid-title matches', () => {
    const results = searchMovies('in')
    const firstMid = results.findIndex((m) => !m.title.toLowerCase().startsWith('in'))
    const lastPrefix = results.findLastIndex((m) => m.title.toLowerCase().startsWith('in'))
    expect(lastPrefix).toBeLessThan(firstMid)
  })

  it('respects the limit', () => {
    expect(searchMovies('e', 5)).toHaveLength(5)
  })

  it('returns nothing when no title matches', () => {
    expect(searchMovies('zzzz-not-a-movie')).toEqual([])
  })
})

describe('my list', () => {
  it('is empty when nothing is stored', () => {
    expect(getMyList(memoryStorage())).toEqual([])
  })

  it('adds movies at the bottom, in order', () => {
    const storage = memoryStorage()
    addMovie('whiplash-2014', storage)
    addMovie('parasite-2019', storage)
    expect(ids(getMyList(storage))).toEqual(['whiplash-2014', 'parasite-2019'])
    expect(isInList('parasite-2019', storage)).toBe(true)
  })

  it('does not add the same movie twice', () => {
    const storage = memoryStorage()
    addMovie('whiplash-2014', storage)
    addMovie('whiplash-2014', storage)
    expect(getMyList(storage)).toHaveLength(1)
  })

  it('rejects movies that are not in the catalog', () => {
    expect(() => addMovie('not-a-movie', memoryStorage())).toThrow()
  })

  it('removes a movie and keeps the rest in order', () => {
    const storage = memoryStorage()
    for (const id of ['whiplash-2014', 'parasite-2019', 'up-2009']) addMovie(id, storage)
    removeMovie('parasite-2019', storage)
    expect(ids(getMyList(storage))).toEqual(['whiplash-2014', 'up-2009'])
  })

  it('notifies subscribers when the list changes', () => {
    const storage = memoryStorage()
    let calls = 0
    const unsubscribe = subscribe(() => { calls += 1 })
    addMovie('whiplash-2014', storage)
    removeMovie('whiplash-2014', storage)
    unsubscribe()
    addMovie('up-2009', storage)
    expect(calls).toBe(2)
  })

  it('falls back to empty on corrupt or non-list data', () => {
    expect(getMyList(memoryStorage({ 'sceneit.myList': '{not json' }))).toEqual([])
    expect(getMyList(memoryStorage({ 'sceneit.myList': '{"a":1}' }))).toEqual([])
  })

  it('drops stored ids that are no longer in the catalog', () => {
    const storage = memoryStorage({ 'sceneit.myList': '["gone-1999","up-2009"]' })
    expect(ids(getMyList(storage))).toEqual(['up-2009'])
  })

  it('falls back to empty when storage is unavailable', () => {
    expect(getMyList(null)).toEqual([])
  })
})
