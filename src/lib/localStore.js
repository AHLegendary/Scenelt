// Local data layer for the demo. UI components call these instead of touching
// fake data or localStorage directly, so a Supabase-backed version can replace
// this module later without changing the pages.

import { LEADERBOARD } from '../data/leaderboard.js'

export const PERIODS = ['weekly', 'monthly']
export const CATEGORIES = ['highest', 'watched']

const LIST_KEY = 'sceneit.myList'

// Returns the leaderboard for a period, ordered by category:
// 'highest' = highest community score, 'watched' = most users ranked it.
export function getLeaderboard(period = 'weekly', category = 'highest') {
  const rows = LEADERBOARD[period]
  if (!rows) throw new Error(`Unknown leaderboard period: ${period}`)
  const key = category === 'watched' ? 'rankers' : 'score'
  return [...rows]
    .sort((a, b) => b[key] - a[key])
    .map((movie, i) => ({ ...movie, rank: i + 1 }))
}

// The guest's ranked list, best first. Empty until they add a movie.
export function getMyList(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(LIST_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}
