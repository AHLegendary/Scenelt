// One-time helper: fills src/data/movies.json with data from TMDb so the demo
// shows real posters and movie details without any TMDb calls at runtime.
//
// For each movie it:
//   1. searches TMDb by title + year to get tmdb_id and poster_path
//   2. loads details + credits for overview, tagline, runtime, backdrop,
//      directors and top cast, plus TMDb's recommendations for it (kept as
//      `similar`: the catalog movies TMDb recommends, used for "For You")
// Movies that already have that data are skipped, so re-running is cheap.
//
// Usage (needs TMDB_READ_TOKEN in .env or the environment):
//   npm run movie-data          # only fill what's missing
//   npm run movie-data -- --all # refresh everything
//
// Then commit the updated movies.json.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { hasDetails, pickDetails, pickSimilar } from '../src/lib/movieDetails.js'

const CATALOG = new URL('../src/data/movies.json', import.meta.url)
const ENV_FILE = new URL('../.env', import.meta.url)
const API = 'https://api.themoviedb.org/3'

function readToken() {
  if (process.env.TMDB_READ_TOKEN) return process.env.TMDB_READ_TOKEN
  if (!existsSync(ENV_FILE)) return null
  const line = readFileSync(ENV_FILE, 'utf8')
    .split('\n')
    .find((l) => l.trim().startsWith('TMDB_READ_TOKEN='))
  return line ? line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '') : null
}

const normalize = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const pause = () => new Promise((r) => setTimeout(r, 60)) // stay well under TMDb's rate limit

async function tmdb(token, path, params = {}) {
  const url = new URL(API + path)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`TMDb responded ${res.status}`)
  return res.json()
}

async function search(token, title, year) {
  const { results = [] } = await tmdb(token, '/search/movie', { query: title, year })
  // Prefer an exact title match; otherwise trust TMDb's top result for that year.
  return results.find((r) => normalize(r.title) === normalize(title)) || results[0] || null
}

const token = readToken()
if (!token) {
  console.error('TMDB_READ_TOKEN is not set (add it to .env or export it).')
  process.exit(1)
}

const refreshAll = process.argv.includes('--all')
const movies = JSON.parse(readFileSync(CATALOG, 'utf8'))
const problems = []
let found = 0
let detailed = 0

// Pass 1: make sure every movie has a TMDb id and poster.
for (const movie of movies) {
  if (!refreshAll && movie.tmdb_id && movie.poster_path) continue
  const label = `${movie.title} (${movie.year})`
  try {
    const hit = await search(token, movie.title, movie.year)
    await pause()
    if (!hit) {
      problems.push(`${label}: not found on TMDb`)
      continue
    }
    movie.tmdb_id = hit.id
    movie.poster_path = hit.poster_path || movie.poster_path || null
    found += 1
  } catch (err) {
    problems.push(`${label}: ${err.message}`)
  }
}

// Pass 2: details, credits and recommendations in one request per movie.
// Needs every tmdb_id from pass 1 to match recommendations to the catalog.
const tmdbToId = new Map(movies.filter((m) => m.tmdb_id).map((m) => [m.tmdb_id, m.id]))
for (const movie of movies) {
  if (!movie.tmdb_id) continue
  if (!refreshAll && hasDetails(movie) && Array.isArray(movie.similar)) continue
  const label = `${movie.title} (${movie.year})`
  try {
    const raw = await tmdb(token, `/movie/${movie.tmdb_id}`, { append_to_response: 'credits,recommendations' })
    await pause()
    Object.assign(movie, pickDetails(raw))
    movie.similar = pickSimilar(raw, tmdbToId)
    detailed += 1
    console.log(`✓ ${label}${movie.similar.length ? ` (${movie.similar.length} similar)` : ''}`)
  } catch (err) {
    problems.push(`${label}: ${err.message}`)
  }
}

writeFileSync(CATALOG, JSON.stringify(movies, null, 2) + '\n')
console.log(`\nLooked up ${found} movie(s), added details for ${detailed}.`)
if (problems.length) console.log(`Problems:\n  ${problems.join('\n  ')}`)
