import { tmdbFetch, toMovie } from '../_lib/tmdb.js';

const MAX_QUERY_LENGTH = 100;

// GET /api/movies/search?q=inception
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) {
    return res.status(400).json({ error: 'Missing search query' });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ error: 'Search query is too long' });
  }

  try {
    const data = await tmdbFetch('/search/movie', {
      query,
      include_adult: 'false',
      page: '1',
    });
    return res.status(200).json({ results: data.results.map(toMovie) });
  } catch (error) {
    console.error('Movie search failed:', error.message);
    return res.status(502).json({ error: "Couldn't load movies, try again later." });
  }
}