// Movie catalog and demo leaderboard. UI components call these instead of
// reading src/data directly. The signed-in user's ranked list lives in
// supabaseStore.js; this file will shrink further once search and the
// leaderboard come from the API and database.

import MOVIES from '../data/movies.json'
import { LEADERBOARD } from '../data/leaderboard.js'

export const PERIODS = ['weekly', 'monthly']
export const CATEGORIES = ['highest', 'watched']

const POSTER_BASE = 'https://image.tmdb.org/t/p/'
const BY_ID = new Map(MOVIES.map((m) => [m.id, m]))

// ------------------------------------------------------------------ catalog

// Every movie in the local catalog.
export function getCatalog() {
  return MOVIES
}

export function getMovie(id) {
  return BY_ID.get(id) || null
}

// Full TMDb image URL for a path like "/abc.jpg", or null.
export function imageUrl(path, size = 'w342') {
  return path ? `${POSTER_BASE}${size}${path}` : null
}

// Full TMDb image URL, or null when the movie has no poster yet.
export function posterUrl(movie, size = 'w342') {
  return imageUrl(movie?.poster_path, size)
}

// Lowercase and strip accents so "amelie" finds "Amélie".
function normalize(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// Title search over the local catalog. Titles that start with the query come
// first, then ones where a word starts with it, then any other match.
export function searchMovies(query, limit = 20) {
  const q = normalize(query || '')
  if (!q) return []
  const scored = []
  for (const movie of MOVIES) {
    const title = normalize(movie.title)
    const at = title.indexOf(q)
    if (at === -1) continue
    const tier = at === 0 ? 0 : /\W/.test(title[at - 1]) ? 1 : 2
    scored.push({ movie, tier })
  }
  return scored
    .sort((a, b) => a.tier - b.tier || b.movie.year - a.movie.year)
    .slice(0, limit)
    .map((s) => s.movie)
}

// A few movies to show in search before the user types anything.
export function getSuggestions(limit = 8) {
  return LEADERBOARD.weekly.slice(0, limit).map((row) => getMovie(row.movieId))
}

// ------------------------------------------------------------------ leaderboard

// Returns the leaderboard for a period, ordered by category:
// 'highest' = highest community score, 'watched' = most users ranked it.
export function getLeaderboard(period = 'weekly', category = 'highest') {
  const rows = LEADERBOARD[period]
  if (!rows) throw new Error(`Unknown leaderboard period: ${period}`)
  const key = category === 'watched' ? 'rankers' : 'score'
  return [...rows]
    .sort((a, b) => b[key] - a[key])
    .map((row, i) => ({ ...getMovie(row.movieId), score: row.score, rankers: row.rankers, rank: i + 1 }))
}

// How the community ranks a movie this week and this month, from the
// leaderboard data. Each is { rank, score, rankers } or null if it isn't listed.
export function getCommunityStats(id) {
  const stats = {}
  for (const period of PERIODS) {
    const row = getLeaderboard(period, 'highest').find((r) => r.id === id)
    stats[period] = row ? { rank: row.rank, score: row.score, rankers: row.rankers } : null
  }
  return stats
}
