import { describe, it, expect } from 'vitest'
import { formatRuntime, hasDetails, pickDetails, pickSimilar } from '../../src/lib/movieDetails.js'
import { getCommunityStats, imageUrl } from '../../src/lib/localStore.js'

describe('pickDetails', () => {
  const raw = {
    overview: '  A story.  ',
    tagline: '',
    runtime: 166,
    backdrop_path: '/back.jpg',
    credits: {
      crew: [
        { job: 'Director', name: 'Denis' },
        { job: 'Writer', name: 'Someone' },
        { job: 'Director', name: 'Denis' }, // TMDb sometimes lists people twice
        { job: 'Director', name: 'Co Director' },
      ],
      cast: [7, 2, 0, 5, 1, 3, 4, 6].map((order) => ({ name: `Actor ${order}`, order })),
    },
  }

  it('keeps the fields the app shows and trims text', () => {
    const d = pickDetails(raw)
    expect(d.overview).toBe('A story.')
    expect(d.runtime).toBe(166)
    expect(d.backdrop_path).toBe('/back.jpg')
  })

  it('turns empty strings into null', () => {
    expect(pickDetails(raw).tagline).toBeNull()
  })

  it('lists each director once, in order', () => {
    expect(pickDetails(raw).directors).toEqual(['Denis', 'Co Director'])
  })

  it('takes the top six billed cast members in billing order', () => {
    expect(pickDetails(raw).cast).toEqual(['Actor 0', 'Actor 1', 'Actor 2', 'Actor 3', 'Actor 4', 'Actor 5'])
  })

  it('handles a response with nothing in it', () => {
    expect(pickDetails({})).toEqual({
      overview: null,
      tagline: null,
      runtime: null,
      backdrop_path: null,
      directors: [],
      cast: [],
    })
  })

  it('ignores a zero runtime', () => {
    expect(pickDetails({ runtime: 0 }).runtime).toBeNull()
  })
})

describe('formatRuntime', () => {
  it('formats hours and minutes', () => {
    expect(formatRuntime(166)).toBe('2h 46m')
    expect(formatRuntime(120)).toBe('2h')
    expect(formatRuntime(45)).toBe('45m')
  })

  it('returns null when unknown', () => {
    expect(formatRuntime(null)).toBeNull()
    expect(formatRuntime(0)).toBeNull()
    expect(formatRuntime(undefined)).toBeNull()
  })
})

describe('hasDetails', () => {
  it('is true only after the details fetch has run', () => {
    expect(hasDetails({ title: 'X' })).toBe(false)
    expect(hasDetails({ title: 'X', overview: null })).toBe(true)
    expect(hasDetails(null)).toBe(false)
  })
})

describe('getCommunityStats', () => {
  it('reports weekly and monthly rank for a listed movie', () => {
    const stats = getCommunityStats('oppenheimer-2023')
    expect(stats.monthly.rank).toBe(1)
    expect(stats.weekly).toMatchObject({ rank: 4, score: 8.7 })
  })

  it('is null for periods where the movie is not listed', () => {
    expect(getCommunityStats('up-2009')).toEqual({ weekly: null, monthly: null })
  })
})

describe('imageUrl', () => {
  it('builds TMDb image URLs', () => {
    expect(imageUrl('/b.jpg', 'w780')).toBe('https://image.tmdb.org/t/p/w780/b.jpg')
    expect(imageUrl(null)).toBeNull()
  })
})

describe('pickSimilar', () => {
  const tmdbToId = new Map([[1, 'one-2001'], [2, 'two-2002'], [3, 'three-2003']])

  it('keeps catalog movies in TMDb order and drops the rest', () => {
    const raw = { recommendations: { results: [{ id: 3 }, { id: 99 }, { id: 1 }, { id: 3 }] } }
    expect(pickSimilar(raw, tmdbToId)).toEqual(['three-2003', 'one-2001'])
  })

  it('is empty when TMDb has no recommendations', () => {
    expect(pickSimilar({}, tmdbToId)).toEqual([])
    expect(pickSimilar({ recommendations: { results: [] } }, tmdbToId)).toEqual([])
  })
})
