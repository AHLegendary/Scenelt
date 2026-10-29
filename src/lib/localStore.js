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
// Stored as tiers of movie ids, best first: [["a"], ["b", "c"], ["d"]].
// Tied movies share a tier. The older flat format (["a", "b"]) still loads.

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

function readTiers(storage) {
  let raw
  try {
    raw = JSON.parse(storage?.getItem(LIST_KEY) || '[]')
  } catch {
    return []
  }
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const tiers = []
  for (const entry of raw) {
    const ids = []
    for (const id of Array.isArray(entry) ? entry : [entry]) {
      if (typeof id !== 'string' || !BY_ID.has(id) || seen.has(id)) continue
      seen.add(id)
      ids.push(id)
    }
    if (ids.length) tiers.push(ids)
  }
  return tiers
}

function writeTiers(tiers, storage) {
  try {
    storage?.setItem(LIST_KEY, JSON.stringify(tiers.filter((tier) => tier.length)))
  } catch {
    // Storage full or blocked: the change just won't persist across reloads.
  }
  listeners.forEach((fn) => fn())
}

// Tiers with one movie taken out (empty tiers dropped).
function without(tiers, id) {
  return tiers.map((tier) => tier.filter((x) => x !== id)).filter((tier) => tier.length)
}

// Raw stored value, used as a cheap change marker for React.
export function getListKey(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(LIST_KEY) || '[]'
  } catch {
    return '[]'
  }
}

// The guest's ranked list as tiers of movie objects, best first.
export function getMyTiers(storage = globalThis.localStorage) {
  return readTiers(storage).map((tier) => tier.map(getMovie))
}

// The guest's ranked list as one flat list of movies, best first.
export function getMyList(storage = globalThis.localStorage) {
  return getMyTiers(storage).flat()
}

export function isInList(id, storage = globalThis.localStorage) {
  return readTiers(storage).some((tier) => tier.includes(id))
}

// Puts a movie where head-to-head placement landed it, moving it if it was
// already ranked (that's how reranking saves).
// tied = false: as its own tier at `index` (0 = best).
// tied = true: into the existing tier at `index`.
export function placeMovie(id, { index, tied = false }, storage = globalThis.localStorage) {
  if (!BY_ID.has(id)) throw new Error(`Unknown movie: ${id}`)
  const tiers = without(readTiers(storage), id)
  const at = Math.max(0, Math.min(index, tiers.length))
  if (tied && at < tiers.length) tiers[at] = [...tiers[at], id]
  else tiers.splice(at, 0, [id])
  writeTiers(tiers, storage)
  return getMyList(storage)
}

// Inserts a new movie as its own tier at `index`. A movie that's already
// ranked stays where it is.
export function insertMovie(id, index, storage = globalThis.localStorage) {
  if (!BY_ID.has(id)) throw new Error(`Unknown movie: ${id}`)
  if (isInList(id, storage)) return getMyList(storage)
  return placeMovie(id, { index }, storage)
}

// Adds a movie at the bottom of the list.
export function addMovie(id, storage = globalThis.localStorage) {
  return insertMovie(id, Infinity, storage)
}

export function removeMovie(id, storage = globalThis.localStorage) {
  writeTiers(without(readTiers(storage), id), storage)
  return getMyList(storage)
}
