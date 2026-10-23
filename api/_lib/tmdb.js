// Server-only TMDb helpers. Never import this file from src/ (it reads a secret).
const TMDB_BASE = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

export async function tmdbFetch(path, params = {}) {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) {
    throw new Error('TMDB_READ_TOKEN is not set');
  }

  const url = new URL(TMDB_BASE + path);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const error = new Error(`TMDb request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

// Converts a raw TMDb movie into the shape of our `movies` table.
// Search results only have genre_ids; the details endpoint has full genre objects.
export function toMovie(raw) {
  return {
    tmdb_id: raw.id,
    title: raw.title,
    release_date: raw.release_date || null,
    poster_url: raw.poster_path ? POSTER_BASE + raw.poster_path : null,
    genres: Array.isArray(raw.genres) ? raw.genres.map((genre) => genre.name) : [],
    overview: raw.overview || '',
  };
}