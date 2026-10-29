// Local data layer for the demo. UI components call these instead of touching
// fake data or localStorage directly, so a Supabase-backed version can replace
// this module later without changing the pages.

import MOVIES from '../data/movies.json'
import { LEADERBOARD } from '../data/leaderboard.js'

export const PERIODS = ['weekly', 'monthly']
export const CATEGORIES = ['highest', 'watched']

const LIST_KEY = 'sceneit.myList'
const POSTER_BASE = 'https://image.tmdb.org/t/p/'
const BY_ID = new Map(MOVIES.map((m) => [m.id, m]))

// ------------------------------------------------------------------ catalog

export function getMovie(id) {
  return BY_ID.get(id) || null
}

// Full TMDb image URL, or null when the movie has no poster yet.
export function posterUrl(movie, size = 'w342') {
  return movie?.poster_path ? `${POSTER_BASE}${size}${movie.poster_path}` : null
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

// ------------------------------------------------------------------ my list
// Stored as an ordered array of movie ids, best first.

const listeners = new Set()

// Lets React re-render when the list changes (here or in another tab).
export function subscribe(listener) {
  listeners.add(listener)
  const onStorage = (e) => e.key === LIST_KEY && listener()
  globalThis.addEventListener?.('storage', onStorage)
  return () => {
    listeners.delete(listener)
    globalThis.removeEventListener?.('storage', onStorage)
  }
}

function readIds(storage) {
  try {
    const ids = JSON.parse(storage?.getItem(LIST_KEY) || '[]')
    return Array.isArray(ids) ? ids.filter((id) => BY_ID.has(id)) : []
  } catch {
    return []
  }
}

function writeIds(ids, storage) {
  try {
    storage?.setItem(LIST_KEY, JSON.stringify(ids))
  } catch {
    // Storage full or blocked: the change just won't persist across reloads.
  }
  listeners.forEach((fn) => fn())
}

// Raw stored value, used as a cheap change marker for React.
export function getListKey(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(LIST_KEY) || '[]'
  } catch {
    return '[]'
  }
}

// The guest's ranked list as movie objects, best first.
export function getMyList(storage = globalThis.localStorage) {
  return readIds(storage).map(getMovie)
}

export function isInList(id, storage = globalThis.localStorage) {
  return readIds(storage).includes(id)
}

// Puts a movie at a given spot in the list (0 = best), e.g. where head-to-head
// placement landed it. Adding a movie that's already there does nothing.
export function insertMovie(id, index, storage = globalThis.localStorage) {
  if (!BY_ID.has(id)) throw new Error(`Unknown movie: ${id}`)
  const ids = readIds(storage)
  if (ids.includes(id)) return getMyList(storage)
  const at = Math.max(0, Math.min(index, ids.length))
  writeIds([...ids.slice(0, at), id, ...ids.slice(at)], storage)
  return getMyList(storage)
}

// Adds a movie at the bottom of the list.
export function addMovie(id, storage = globalThis.localStorage) {
  return insertMovie(id, Infinity, storage)
}

export function removeMovie(id, storage = globalThis.localStorage) {
  writeIds(readIds(storage).filter((x) => x !== id), storage)
  return getMyList(storage)
}
