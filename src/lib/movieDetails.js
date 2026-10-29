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

// True once a movie has been through the details fetch.
export function hasDetails(movie) {
  return Boolean(movie && 'overview' in movie)
}
