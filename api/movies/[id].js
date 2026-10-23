import { tmdbFetch, toMovie } from '../_lib/tmdb.js';

// GET /api/movies/27205
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = String(req.query.id ?? '');
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid movie id' });
  }

  try {
    const data = await tmdbFetch(`/movie/${id}`);
    return res.status(200).json({ movie: toMovie(data) });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    console.error('Movie details failed:', error.message);
    return res.status(502).json({ error: "Couldn't load movie, try again later." });
  }
}