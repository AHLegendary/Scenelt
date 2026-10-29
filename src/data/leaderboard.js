// Fake community leaderboard data for the local demo.
// Stands in for the leaderboard service until the Supabase views exist.
// movieId points into movies.json. score: average community score out of 10.
// rankers: how many users ranked it.

export const LEADERBOARD = {
  weekly: [
    { movieId: 'dune-part-two-2024', score: 9.2, rankers: 412 },
    { movieId: 'past-lives-2023', score: 9.0, rankers: 238 },
    { movieId: 'spider-man-across-the-spider-verse-2023', score: 8.9, rankers: 501 },
    { movieId: 'oppenheimer-2023', score: 8.7, rankers: 467 },
    { movieId: 'the-holdovers-2023', score: 8.6, rankers: 189 },
    { movieId: 'everything-everywhere-all-at-once-2022', score: 8.5, rankers: 356 },
    { movieId: 'parasite-2019', score: 8.4, rankers: 298 },
    { movieId: 'whiplash-2014', score: 8.3, rankers: 274 },
    { movieId: 'anatomy-of-a-fall-2023', score: 8.1, rankers: 141 },
    { movieId: 'poor-things-2023', score: 7.9, rankers: 203 },
  ],
  monthly: [
    { movieId: 'oppenheimer-2023', score: 9.1, rankers: 1820 },
    { movieId: 'dune-part-two-2024', score: 9.0, rankers: 1655 },
    { movieId: 'parasite-2019', score: 8.9, rankers: 1290 },
    { movieId: 'interstellar-2014', score: 8.8, rankers: 1544 },
    { movieId: 'spider-man-across-the-spider-verse-2023', score: 8.7, rankers: 1712 },
    { movieId: 'the-dark-knight-2008', score: 8.6, rankers: 1388 },
    { movieId: 'whiplash-2014', score: 8.5, rankers: 1102 },
    { movieId: 'past-lives-2023', score: 8.4, rankers: 845 },
    { movieId: 'get-out-2017', score: 8.2, rankers: 977 },
    { movieId: 'la-la-land-2016', score: 8.0, rankers: 1063 },
  ],
}
