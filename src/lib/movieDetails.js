// Helpers for movie details. Pure functions, shared by the app and by
// scripts/fetch-movie-data.mjs (which runs in Node), so no browser or
// React imports here.

const CAST_LIMIT = 6

// Picks the fields SceneIt shows from a TMDb /movie/{id}?append_to_response=credits
// response. Missing or empty values become null / [] so the UI can skip them.
export function pickDetails(raw = {}) {
  const crew = raw.credits?.crew ?? []
  const cast = raw.credits?.cast ?? []
  return {
    overview: raw.overview?.trim() || null,
    tagline: raw.tagline?.trim() || null,
    runtime: Number.isFinite(raw.runtime) && raw.runtime > 0 ? raw.runtime : null,
    backdrop_path: raw.backdrop_path || null,
    directors: [...new Set(crew.filter((p) => p.job === 'Director').map((p) => p.name))],
    cast: [...cast]
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .slice(0, CAST_LIMIT)
      .map((p) => p.name),
  }
}

// 166 -> "2h 46m", 45 -> "45m", null -> null
export function formatRuntime(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m}m`
  return m ? `${h}h ${m}m` : `${h}h`
}

// From a TMDb response that includes `recommendations`, the ids of catalog
// movies TMDb recommends for this one, in TMDb's order. tmdbToId maps
// TMDb ids to our catalog ids; movies outside the catalog are dropped.
export function pickSimilar(raw = {}, tmdbToId = new Map()) {
  const results = raw.recommendations?.results ?? []
  const ids = results.map((r) => tmdbToId.get(r.id)).filter(Boolean)
  return [...new Set(ids)]
}

// True once a movie has been through the details fetch.
export function hasDetails(movie) {
  return Boolean(movie && 'overview' in movie)
}

// Picks IMDb and Rotten Tomatoes scores from an OMDb response
// (https://www.omdbapi.com/?i=tt...). OMDb writes missing values as "N/A"
// and numbers as text ("8.5", "642,123", "92%"), so everything is parsed
// here. Returns { imdb, imdb_votes, rt }, each a number or null.
export function pickRatings(omdb = {}) {
  if (!omdb || omdb.Response === 'False') return { imdb: null, imdb_votes: null, rt: null }
  const rtEntry = (omdb.Ratings ?? []).find((r) => r.Source === 'Rotten Tomatoes')
  const imdb = parseFloat(omdb.imdbRating)
  const votes = parseInt(String(omdb.imdbVotes ?? '').replace(/,/g, ''), 10)
  const rt = parseInt(rtEntry?.Value, 10)
  return {
    imdb: imdb >= 0 && imdb <= 10 ? imdb : null,
    imdb_votes: votes > 0 ? votes : null,
    rt: rt >= 0 && rt <= 100 ? rt : null,
  }
}

// 642123 -> "642K", 1500000 -> "1.5M", 950 -> "950"
export function formatVotes(count) {
  if (!Number.isFinite(count) || count <= 0) return null
  if (count >= 999500) return `${+(count / 1e6).toFixed(1)}M`
  if (count >= 1e3) return `${Math.round(count / 1e3)}K`
  return String(count)
}

// True when a movie has at least one outside score to show.
export function hasRatings(movie) {
  const r = movie?.ratings
  return Boolean(r && (r.imdb !== null || r.rt !== null))
}
