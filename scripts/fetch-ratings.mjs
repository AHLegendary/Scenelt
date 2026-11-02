// One-time helper: adds IMDb and Rotten Tomatoes scores to src/data/movies.json
// so the movie details panel can show them without any calls at runtime.
// These are outside info only: SceneIt's leaderboard and scores still come
// from SceneIt users.
//
// For each movie it:
//   1. gets the IMDb id from TMDb (/movie/{id} includes imdb_id)
//   2. asks OMDb (https://www.omdbapi.com) for that IMDb id, which returns
//      the IMDb rating and vote count plus the Rotten Tomatoes Tomatometer
// Movies already checked are skipped, so re-running is cheap. A free OMDb
// key allows 1,000 requests a day; the catalog needs about 60.
//
// Usage (needs TMDB_READ_TOKEN and OMDB_API_KEY in .env or the environment):
//   npm run ratings           # only movies not checked yet
//   npm run ratings -- --all  # refresh everything
//
// Then commit the updated movies.json.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { pickRatings } from '../src/lib/movieDetails.js'

const CATALOG = new URL('../src/data/movies.json', import.meta.url)
const ENV_FILE = new URL('../.env', import.meta.url)

function readEnv(name) {
  if (process.env[name]) return process.env[name]
  if (!existsSync(ENV_FILE)) return null
  const line = readFileSync(ENV_FILE, 'utf8')
    .split('\n')
    .find((l) => l.trim().startsWith(`${name}=`))
  return line ? line.split('=').slice(1).join('=').split(' #')[0].trim().replace(/^["']|["']$/g, '') : null
}

const pause = () => new Promise((r) => setTimeout(r, 100)) // be gentle with both APIs

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers: { Accept: 'application/json', ...headers } })
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`)
  return res.json()
}

const tmdbToken = readEnv('TMDB_READ_TOKEN')
const omdbKey = readEnv('OMDB_API_KEY')
if (!tmdbToken || !omdbKey) {
  console.error('Set TMDB_READ_TOKEN and OMDB_API_KEY (add them to .env or export them).')
  console.error('Get a free OMDb key at https://www.omdbapi.com/apikey.aspx')
  process.exit(1)
}

const refreshAll = process.argv.includes('--all')
const movies = JSON.parse(readFileSync(CATALOG, 'utf8'))
const today = new Date().toISOString().slice(0, 10)
const problems = []
let updated = 0

for (const movie of movies) {
  if (!refreshAll && movie.ratings) continue
  const label = `${movie.title} (${movie.year})`
  try {
    if (!movie.imdb_id) {
      if (!movie.tmdb_id) throw new Error('no tmdb_id (run npm run movie-data first)')
      const tmdb = await getJson(`https://api.themoviedb.org/3/movie/${movie.tmdb_id}`, {
        Authorization: `Bearer ${tmdbToken}`,
      })
      await pause()
      if (!tmdb.imdb_id) throw new Error('TMDb has no IMDb id for it')
      movie.imdb_id = tmdb.imdb_id
    }

    const url = new URL('https://www.omdbapi.com/')
    url.searchParams.set('i', movie.imdb_id)
    url.searchParams.set('apikey', omdbKey)
    const omdb = await getJson(url)
    await pause()
    // A bad key or a used-up daily limit comes back as Response "False" with an Error.
    if (omdb.Response === 'False' && /key|limit/i.test(omdb.Error ?? '')) {
      console.error(`OMDb: ${omdb.Error}`)
      break
    }

    movie.ratings = { ...pickRatings(omdb), checked: today }
    updated += 1
    const { imdb, rt } = movie.ratings
    console.log(`✓ ${label}: IMDb ${imdb ?? '-'}, RT ${rt === null ? '-' : `${rt}%`}`)
  } catch (err) {
    problems.push(`${label}: ${err.message}`)
  }
}

writeFileSync(CATALOG, JSON.stringify(movies, null, 2) + '\n')
console.log(`\nAdded ratings for ${updated} movie(s).`)
if (problems.length) console.log(`Problems:\n  ${problems.join('\n  ')}`)
