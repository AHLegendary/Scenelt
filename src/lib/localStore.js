// Local movie catalog. UI components call these instead of reading src/data
// directly. The signed-in user's ranked list lives in supabaseStore.js and
// the leaderboard in leaderboard.js; this file will shrink further once
// search comes from the API.

import MOVIES from '../data/movies.json'

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

// A few well-known movies to show in search before the user types anything.
const SUGGESTION_IDS = [
  'dune-part-two-2024',
  'past-lives-2023',
  'spider-man-across-the-spider-verse-2023',
  'oppenheimer-2023',
  'the-holdovers-2023',
  'everything-everywhere-all-at-once-2022',
  'parasite-2019',
  'whiplash-2014',
]

export function getSuggestions(limit = 8) {
  return SUGGESTION_IDS.slice(0, limit).map(getMovie).filter(Boolean)
}
