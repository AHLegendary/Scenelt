import { describe, it, expect } from 'vitest'
import {
  answer,
  applyPlacement,
  finalPlacement,
  finalPosition,
  insertWith,
  isDone,
  maxComparisons,
  nextOpponent,
  startInsertion,
  NEW,
  OPPONENT,
  TIE,
  tierRanks,
} from '../../src/features/ranking/binaryInsertion.js'

// A list of n movies ranked best first; `taste` is the user's hidden score.
// Lower taste = liked more, so movie i is the user's (i + 1)th favorite.
function rankedList(n) {
  return Array.from({ length: n }, (_, i) => ({ id: `m${i}`, taste: i * 2 }))
}

// The user consistently prefers whichever movie has the lower taste score.
const byTaste = (a, b) => a.taste < b.taste

// Small seeded RNG so failures are reproducible.
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32
    return s / 2 ** 32
  }
}

const SIZES = [0, 1, 2, 3, 10, 25, 50, 100, 500]

describe('maxComparisons', () => {
  it('matches ceil(log2(n + 1))', () => {
    expect([0, 1, 2, 3, 7, 8, 15, 500].map(maxComparisons)).toEqual([0, 1, 2, 2, 3, 4, 4, 9])
  })
})

describe('binary insertion', () => {
  it('places the first movie with no comparisons', () => {
    const result = insertWith([], { id: 'new', taste: 1 }, byTaste)
    expect(result.position).toBe(0)
    expect(result.tied).toBe(false)
    expect(result.comparisons).toBe(0)
    expect(result.list).toEqual([{ id: 'new', taste: 1 }])
  })

  for (const n of SIZES) {
    it(`never exceeds ceil(log2(n + 1)) comparisons and lands correctly (n = ${n})`, () => {
      const list = rankedList(n)
      // Try every possible slot: before the best, between each pair, after the worst.
      for (let slot = 0; slot <= n; slot += 1) {
        const item = { id: 'new', taste: slot * 2 - 1 }
        const result = insertWith(list, item, byTaste)
        expect(result.position).toBe(slot)
        expect(result.comparisons).toBeLessThanOrEqual(maxComparisons(n))
        expect(result.list.map((m) => m.taste)).toEqual([...result.list.map((m) => m.taste)].sort((a, b) => a - b))
      }
    })
  }

  it('gives the same result when the recorded answers are replayed', () => {
    const random = rng(42)
    for (const n of SIZES) {
      const list = rankedList(n)
      const item = { id: 'new', taste: Math.floor(random() * 2 * n) - 0.5 }
      const recorded = []
      const first = insertWith(list, item, (a, b) => {
        const choice = byTaste(a, b)
        recorded.push(choice)
        return choice
      })
      let i = 0
      const replay = insertWith(list, item, () => recorded[i++])
      expect(replay.position).toBe(first.position)
      expect(i).toBe(recorded.length)
    }
  })

  it('is consistent with every choice even when answers are arbitrary', () => {
    // Whatever the user says, the final spot must agree with each answer:
    // above every opponent they preferred the new movie to, below the rest.
    const random = rng(7)
    for (const n of SIZES) {
      const list = rankedList(n)
      const item = { id: 'new' }
      const answers = []
      const result = insertWith(list, item, (_, opponent) => {
        const prefersNew = random() < 0.5
        answers.push({ opponent, prefersNew })
        return prefersNew
      })
      for (const { opponent, prefersNew } of answers) {
        const opponentAt = result.list.indexOf(opponent)
        if (prefersNew) expect(result.position).toBeLessThan(opponentAt)
        else expect(result.position).toBeGreaterThan(opponentAt)
      }
      expect(result.comparisons).toBeLessThanOrEqual(maxComparisons(n))
    }
  })

  it('can be driven one answer at a time', () => {
    const list = rankedList(3) // tastes 0, 2, 4
    let state = startInsertion(list, { id: 'new', taste: 3 })
    expect(nextOpponent(state).id).toBe('m1')
    state = answer(state, false) // liked m1 (taste 2) more
    expect(nextOpponent(state).id).toBe('m2')
    state = answer(state, true) // liked new more than m2 (taste 4)
    expect(isDone(state)).toBe(true)
    expect(nextOpponent(state)).toBeNull()
    expect(finalPosition(state)).toBe(2)
  })

  it('does not change the original list', () => {
    const list = rankedList(5)
    const copy = [...list]
    insertWith(list, { id: 'new', taste: 3 }, byTaste)
    expect(list).toEqual(copy)
  })

  it('rejects a movie that is already ranked', () => {
    expect(() => startInsertion(rankedList(3), { id: 'm1' })).toThrow()
  })

  it('refuses to answer after finishing or report a position before finishing', () => {
    const state = startInsertion(rankedList(2), { id: 'new' })
    expect(() => finalPosition(state)).toThrow()
    expect(() => answer(startInsertion([], { id: 'new' }), true)).toThrow()
  })
})

// The user likes movies with equal taste scores the same.
const withTies = (a, b) => (a.taste === b.taste ? TIE : a.taste < b.taste ? NEW : OPPONENT)

describe('ties', () => {
  for (const n of SIZES.filter((size) => size > 0)) {
    it(`joins the matching tier within the bound (n = ${n})`, () => {
      const list = rankedList(n)
      for (let target = 0; target < n; target += 1) {
        const item = { id: 'new', taste: target * 2 }
        const result = insertWith(list, item, withTies)
        expect(result.tied).toBe(true)
        expect(result.position).toBe(target)
        expect(result.tiers[target].map((m) => m.id)).toEqual([`m${target}`, 'new'])
        expect(result.tiers).toHaveLength(n)
        expect(result.comparisons).toBeLessThanOrEqual(maxComparisons(n))
      }
    })
  }

  it('counts each tier once, so tied lists need fewer comparisons', () => {
    // 100 movies in 10 tiers of 10: at most ceil(log2(11)) = 4 comparisons.
    const tiers = Array.from({ length: 10 }, (_, t) =>
      Array.from({ length: 10 }, (_, k) => ({ id: `t${t}-${k}`, taste: t * 2 })),
    )
    for (let slot = 0; slot <= 10; slot += 1) {
      const result = insertWith(tiers, { id: 'new', taste: slot * 2 - 1 }, withTies)
      expect(result.position).toBe(slot)
      expect(result.comparisons).toBeLessThanOrEqual(maxComparisons(10))
    }
  })

  it('compares against the first movie of a tied tier', () => {
    const tiers = [[{ id: 'a' }, { id: 'b' }]]
    expect(nextOpponent(startInsertion(tiers, { id: 'new' })).id).toBe('a')
  })

  it('reports a tie placement and stops asking', () => {
    let state = startInsertion(rankedList(7), { id: 'new' })
    state = answer(state, TIE)
    expect(isDone(state)).toBe(true)
    expect(nextOpponent(state)).toBeNull()
    expect(finalPlacement(state)).toEqual({ index: 3, tied: true })
  })

  it('rejects unknown answers', () => {
    expect(() => answer(startInsertion(rankedList(2), { id: 'new' }), 'maybe')).toThrow()
  })

  it('applies placements without changing the input', () => {
    const tiers = [[{ id: 'a' }], [{ id: 'b' }]]
    const item = { id: 'x' }
    expect(applyPlacement(tiers, item, { index: 1, tied: true }).map((t) => t.map((m) => m.id))).toEqual([['a'], ['b', 'x']])
    expect(applyPlacement(tiers, item, { index: 1, tied: false }).map((t) => t.map((m) => m.id))).toEqual([['a'], ['x'], ['b']])
    expect(tiers.map((t) => t.length)).toEqual([1, 1])
  })

  it('ranks tied movies together and skips ahead after them', () => {
    expect(tierRanks([[1], [2, 3], [4], [5, 6, 7], [8]])).toEqual([1, 2, 4, 5, 8])
    expect(tierRanks([])).toEqual([])
  })
})
