// One-time helper: fills in tmdb_id and poster_path for src/data/movies.json
// using the TMDb search API, so the demo shows real posters without making
// any TMDb calls at runtime.
//
// Usage (needs TMDB_READ_TOKEN in .env or the environment):
//   npm run posters          # only movies that don't have a poster yet
//   npm run posters -- --all # refresh every movie
//
// Then commit the updated movies.json.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const CATALOG = new URL('../src/data/movies.json', import.meta.url)
const ENV_FILE = new URL('../.env', import.meta.url)

function readToken() {
  if (process.env.TMDB_READ_TOKEN) return process.env.TMDB_READ_TOKEN
  if (!existsSync(ENV_FILE)) return null
  const line = readFileSync(ENV_FILE, 'utf8')
    .split('\n')
    .find((l) => l.trim().startsWith('TMDB_READ_TOKEN='))
  return line ? line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '') : null
}

const normalize = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

async function search(token, title, year) {
  const url = new URL('https://api.themoviedb.org/3/search/movie')
  url.searchParams.set('query', title)
  url.searchParams.set('year', String(year))
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`TMDb responded ${res.status}`)
  const { results = [] } = await res.json()
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
let updated = 0
const missing = []

for (const movie of movies) {
  if (movie.poster_path && !refreshAll) continue
  try {
    const hit = await search(token, movie.title, movie.year)
    if (hit?.poster_path) {
      movie.tmdb_id = hit.id
      movie.poster_path = hit.poster_path
      updated += 1
      console.log(`✓ ${movie.title} (${movie.year})`)
    } else {
      missing.push(movie.title)
      console.log(`– ${movie.title} (${movie.year}): no poster found`)
    }
  } catch (err) {
    missing.push(movie.title)
    console.log(`✗ ${movie.title}: ${err.message}`)
  }
  await new Promise((r) => setTimeout(r, 60)) // stay well under TMDb's rate limit
}

writeFileSync(CATALOG, JSON.stringify(movies, null, 2) + '\n')
console.log(`\nUpdated ${updated} movie(s).${missing.length ? ` Still missing: ${missing.join(', ')}` : ''}`)
