// Numerical scores from a ranked list.
//
// Scores aren't stored: they come from where a movie sits and how long the
// list is at display time. The top of the list scores 10.0 and the bottom 1.0,
// spread evenly in between. Tied movies share one score (the average of the
// positions they cover). Scores only show once the list is long enough to mean
// something.

export const SCORE_UNLOCK = 10
export const TOP_SCORE = 10
export const BOTTOM_SCORE = 1

// Map of movie id -> score (one decimal), or null if fewer than SCORE_UNLOCK
// movies are ranked. tiers: [[movie], [movie, movie], ...], best first.
export function scoreTiers(tiers, unlockAt = SCORE_UNLOCK) {
  const total = tiers.reduce((sum, tier) => sum + tier.length, 0)
  if (total < unlockAt || total < 2) return null

  const scores = new Map()
  let start = 0 // 0-based position of the tier's first movie
  for (const tier of tiers) {
    const middle = start + (tier.length - 1) / 2
    const fromTop = 1 - middle / (total - 1) // 1 at the top, 0 at the bottom
    const score = Math.round((BOTTOM_SCORE + (TOP_SCORE - BOTTOM_SCORE) * fromTop) * 10) / 10
    for (const movie of tier) scores.set(movie.id, score)
    start += tier.length
  }
  return scores
}

// How many more movies until scores unlock (0 once unlocked).
export function moviesUntilScores(count, unlockAt = SCORE_UNLOCK) {
  return Math.max(0, unlockAt - count)
}
