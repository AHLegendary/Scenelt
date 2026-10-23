import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toMovie } from '../../api/_lib/tmdb.js';
import searchHandler from '../../api/movies/search.js';
import detailsHandler from '../../api/movies/[id].js';

// Minimal fake of Vercel's res object
function mockRes() {
  const res = {};
  res.status = vi.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body) => {
    res.body = body;
    return res;
  });
  return res;
}

function mockFetchOnce(status, body) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }),
  );
}

describe('toMovie', () => {
  it('builds a full poster URL and genre names', () => {
    const movie = toMovie({
      id: 27205,
      title: 'Inception',
      release_date: '2010-07-15',
      poster_path: '/abc.jpg',
      genres: [{ id: 28, name: 'Action' }],
      overview: 'Dreams.',
    });
    expect(movie).toEqual({
      tmdb_id: 27205,
      title: 'Inception',
      release_date: '2010-07-15',
      poster_url: 'https://image.tmdb.org/t/p/w500/abc.jpg',
      genres: ['Action'],
      overview: 'Dreams.',
    });
  });

  it('handles missing poster, release date, and genres', () => {
    const movie = toMovie({ id: 1, title: 'Unknown', release_date: '', poster_path: null });
    expect(movie.poster_url).toBeNull();
    expect(movie.release_date).toBeNull();
    expect(movie.genres).toEqual([]);
  });
});

describe('GET /api/movies/search', () => {
  beforeEach(() => vi.stubEnv('TMDB_READ_TOKEN', 'test-token'));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns 400 when the query is missing', async () => {
    const res = mockRes();
    await searchHandler({ method: 'GET', query: {} }, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns normalized results from TMDb', async () => {
    mockFetchOnce(200, { results: [{ id: 1, title: 'Up', release_date: '2009-05-28', poster_path: '/up.jpg' }] });
    const res = mockRes();
    await searchHandler({ method: 'GET', query: { q: 'up' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.results[0].title).toBe('Up');
  });

  it('sends the token as a Bearer header', async () => {
    mockFetchOnce(200, { results: [] });
    await searchHandler({ method: 'GET', query: { q: 'up' } }, mockRes());
    const [, options] = fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer test-token');
  });

  it('returns 502 with a friendly message when TMDb fails', async () => {
    mockFetchOnce(500, {});
    const res = mockRes();
    await searchHandler({ method: 'GET', query: { q: 'up' } }, res);
    expect(res.statusCode).toBe(502);
    expect(res.body.error).toMatch(/try again later/);
  });
});

describe('GET /api/movies/[id]', () => {
  beforeEach(() => vi.stubEnv('TMDB_READ_TOKEN', 'test-token'));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('rejects a non-numeric id', async () => {
    const res = mockRes();
    await detailsHandler({ method: 'GET', query: { id: 'abc' } }, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when TMDb has no such movie', async () => {
    mockFetchOnce(404, {});
    const res = mockRes();
    await detailsHandler({ method: 'GET', query: { id: '999999999' } }, res);
    expect(res.statusCode).toBe(404);
  });
});