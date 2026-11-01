import { describe, it, expect } from 'vitest'
import MOVIES from '../../src/data/movies.json'
import {
  getSuggestions,
  posterUrl,
  searchMovies,
} from '../../src/lib/localStore.js'

const ids = (movies) => movies.map((m) => m.id)

describe('movie catalog', () => {
  it('has unique ids', () => {
    expect(new Set(ids(MOVIES)).size).toBe(MOVIES.length)
  })

  it('has every suggested movie', () => {
    const suggestions = getSuggestions()
    expect(suggestions).toHaveLength(8)
    expect(suggestions.every(Boolean)).toBe(true)
  })

  it('builds TMDb poster URLs only when a poster path exists', () => {
    expect(posterUrl({ poster_path: '/abc.jpg' }, 'w154')).toBe('https://image.tmdb.org/t/p/w154/abc.jpg')
    expect(posterUrl({ poster_path: null })).toBeNull()
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
