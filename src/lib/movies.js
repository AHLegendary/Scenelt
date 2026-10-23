// Frontend data layer for movies. UI components call these instead of fetch().

async function getJson(url) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'Something went wrong, try again later.');
  }
  return body;
}

export async function searchMovies(query) {
  const { results } = await getJson(`/api/movies/search?q=${encodeURIComponent(query)}`);
  return results;
}

export async function getMovie(tmdbId) {
  const { movie } = await getJson(`/api/movies/${encodeURIComponent(tmdbId)}`);
  return movie;
}