import { describe, it, expect } from 'vitest'
import MOVIES from '../../src/data/movies.json'
import {
  buildRecommendations,
  positionWeights,
  RECS_UNLOCK,
  relatedness,
  scoreCandidates,
} from '../../src/features/recommendations/recommend.js'

const movie = (id, genres = [], similar = []) => ({ id, title: id, genres, similar })
const singles = (movies) => movies.map((m) => [m])
const ids = (items) => items.map((s) => s.movie.id)

describe('positionWeights', () => {
  it('runs from +1 at the top to -1 at the bottom', () => {
    const w = positionWeights(singles([movie('a'), movie('b'), movie('c')]))
    expect([...w.values()]).toEqual([1, 0, -1])
  })

  it('gives tied movies the weight of their shared position', () => {
    const w = positionWeights([[movie('a')], [movie('b'), movie('c')], [movie('d')]])
    expect(w.get('b')).toBeCloseTo(w.get('c'))
    expect(w.get('b')).toBeGreaterThan(w.get('d'))
    expect(w.get('b')).toBeLessThan(w.get('a'))
  })

  it('treats a single movie as a favorite', () => {
    expect(positionWeights([[movie('a')]]).get('a')).toBe(1)
  })
})

describe('relatedness', () => {
  it('is strongest for a TMDb recommendation link, in either direction', () => {
    const a = movie('a', ['Drama'], ['b'])
    const b = movie('b', ['Comedy'])
    expect(relatedness(a, b)).toBe(1)
    expect(relatedness(b, a)).toBe(1)
  })

  it('adds genre overlap on top', () => {
    expect(relatedness(movie('a', ['Drama', 'Romance']), movie('b', ['Drama', 'Romance']))).toBe(0.5)
    expect(relatedness(movie('a', ['Drama']), movie('b', ['Drama', 'Romance']))).toBe(0.25)
  })

  it('is zero for unrelated movies or missing data', () => {
    expect(relatedness(movie('a', ['Horror']), movie('b', ['Family']))).toBe(0)
    expect(relatedness({ id: 'a' }, { id: 'b' })).toBe(0)
  })
})

describe('scoreCandidates', () => {
  // Liked: space movies. Disliked: horror.
  const liked = movie('liked', ['Science Fiction'], ['space-2'])
  const middle = movie('middle', ['Comedy'])
  const disliked = movie('disliked', ['Horror'], ['scary-2'])
  const catalog = [
    liked,
    middle,
    disliked,
    movie('space-2', ['Science Fiction']),
    movie('scary-2', ['Horror']),
    movie('other-scifi', ['Science Fiction', 'Drama']),
    movie('unrelated', ['Documentary']),
  ]
  const tiers = singles([liked, middle, disliked])

  it('never recommends a movie that is already ranked', () => {
    const recommended = ids(scoreCandidates(tiers, catalog))
    for (const id of ['liked', 'middle', 'disliked']) expect(recommended).not.toContain(id)
  })

  it('ranks relatives of top movies first and drops relatives of bottom ones', () => {
    const recommended = ids(scoreCandidates(tiers, catalog))
    expect(recommended[0]).toBe('space-2')
    expect(recommended).toContain('other-scifi')
    expect(recommended).not.toContain('scary-2')
    expect(recommended).not.toContain('unrelated')
  })

  it('names the ranked movie that contributed most', () => {
    const top = scoreCandidates(tiers, catalog)[0]
    expect(top.because.id).toBe('liked')
  })

  it('still works from genres alone when there is no TMDb data', () => {
    const plain = catalog.map(({ similar: _similar, ...m }) => m)
    const plainTiers = singles(plain.slice(0, 3))
    expect(ids(scoreCandidates(plainTiers, plain))[0]).toBe('space-2')
  })

  it('is stable between calls', () => {
    expect(ids(scoreCandidates(tiers, catalog))).toEqual(ids(scoreCandidates(tiers, catalog)))
  })
})

describe('buildRecommendations', () => {
  it(`stays locked until ${RECS_UNLOCK} movies are ranked, counting tied movies`, () => {
    expect(RECS_UNLOCK).toBe(15)
    expect(buildRecommendations(singles(MOVIES.slice(0, 14)), MOVIES)).toEqual({ locked: true, remaining: 1 })
    const withTie = [[MOVIES[0], MOVIES[1]], ...singles(MOVIES.slice(2, 15))]
    expect(buildRecommendations(withTie, MOVIES).locked).toBe(false)
  })

  it('builds a top-picks row and "because" rows from the real catalog', () => {
    const result = buildRecommendations(singles(MOVIES.slice(0, 15)), MOVIES)
    expect(result.locked).toBe(false)
    expect(result.rows[0].id).toBe('top')
    expect(result.rows[0].items.length).toBeGreaterThan(0)
    expect(result.rows.some((r) => r.title.startsWith('Because you ranked'))).toBe(true)
  })

  it('never repeats a movie across rows or recommends a ranked one', () => {
    const ranked = MOVIES.slice(0, 15)
    const result = buildRecommendations(singles(ranked), MOVIES)
    const shown = result.rows.flatMap((r) => ids(r.items))
    expect(new Set(shown).size).toBe(shown.length)
    for (const m of ranked) expect(shown).not.toContain(m.id)
  })

  it('respects the row size', () => {
    const result = buildRecommendations(singles(MOVIES.slice(0, 15)), MOVIES, { perRow: 3 })
    for (const row of result.rows) expect(row.items.length).toBeLessThanOrEqual(3)
  })

  it('returns no rows when everything has been ranked', () => {
    expect(buildRecommendations(singles(MOVIES), MOVIES)).toEqual({ locked: false, rows: [] })
  })
})
