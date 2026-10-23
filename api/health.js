export default function handler(req, res) {
  res.status(200).json({
    tmdbConfigured: Boolean(process.env.TMDB_READ_TOKEN),
  });
}