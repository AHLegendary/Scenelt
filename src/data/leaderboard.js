// Fake community leaderboard data for the local demo.
// Stands in for the leaderboard service until the Supabase views exist.
// score: average community score out of 10. rankers: how many users ranked it.

export const LEADERBOARD = {
  weekly: [
    { id: 1, title: 'Dune: Part Two', year: 2024, score: 9.2, rankers: 412 },
    { id: 2, title: 'Past Lives', year: 2023, score: 9.0, rankers: 238 },
    { id: 3, title: 'Spider-Man: Across the Spider-Verse', year: 2023, score: 8.9, rankers: 501 },
    { id: 4, title: 'Oppenheimer', year: 2023, score: 8.7, rankers: 467 },
    { id: 5, title: 'The Holdovers', year: 2023, score: 8.6, rankers: 189 },
    { id: 6, title: 'Everything Everywhere All at Once', year: 2022, score: 8.5, rankers: 356 },
    { id: 7, title: 'Parasite', year: 2019, score: 8.4, rankers: 298 },
    { id: 8, title: 'Whiplash', year: 2014, score: 8.3, rankers: 274 },
    { id: 9, title: 'Anatomy of a Fall', year: 2023, score: 8.1, rankers: 141 },
    { id: 10, title: 'Poor Things', year: 2023, score: 7.9, rankers: 203 },
  ],
  monthly: [
    { id: 4, title: 'Oppenheimer', year: 2023, score: 9.1, rankers: 1820 },
    { id: 1, title: 'Dune: Part Two', year: 2024, score: 9.0, rankers: 1655 },
    { id: 7, title: 'Parasite', year: 2019, score: 8.9, rankers: 1290 },
    { id: 11, title: 'Interstellar', year: 2014, score: 8.8, rankers: 1544 },
    { id: 3, title: 'Spider-Man: Across the Spider-Verse', year: 2023, score: 8.7, rankers: 1712 },
    { id: 12, title: 'The Dark Knight', year: 2008, score: 8.6, rankers: 1388 },
    { id: 8, title: 'Whiplash', year: 2014, score: 8.5, rankers: 1102 },
    { id: 2, title: 'Past Lives', year: 2023, score: 8.4, rankers: 845 },
    { id: 13, title: 'Get Out', year: 2017, score: 8.2, rankers: 977 },
    { id: 14, title: 'La La Land', year: 2016, score: 8.0, rankers: 1063 },
  ],
}
