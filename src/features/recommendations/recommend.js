// Personalized recommendations from a user's ranked list.
//
// Every unranked movie in the catalog gets a score from how related it is to
// the movies the user has ranked, weighted by where they ranked them:
// relatives of top movies count for it, relatives of bottom movies count
// against it. Two movies are related when TMDb lists one as a recommendation
// for the other (the `similar` field, filled by npm run movie-data) and,
// more weakly, when they share genres. That keeps it working even before
// `similar` data exists.
//
// Pure functions: no React, no storage. Recommendations unlock at 15 ranked
// movies, matching the design doc.

export const RECS_UNLOCK = 15
const SIMILAR_WEIGHT = 1
const GENRE_WEIGHT = 0.5

// Weight of each ranked movie from its position: +1 at the top, -1 at the
// bottom, 0 in the middle. Tied movies share the weight of their tier.
export function positionWeights(tiers) {
  const total = tiers.reduce((n, tier) => n + tier.length, 0)
  const weights = new Map()
  let start = 0
  for (const tier of tiers) {
    const middle = start + (tier.length - 1) / 2
    const w = total > 1 ? 1 - (2 * middle) / (total - 1) : 1
    for (const movie of tier) weights.set(movie.id, w)
    start += tier.length
  }
  return weights
}

// How related two movies are, from 0 (not at all) up to 1.5.
export function relatedness(a, b) {
  const tmdbLink = a.similar?.includes(b.id) || b.similar?.includes(a.id)
  const ga = new Set(a.genres ?? [])
  const gb = new Set(b.genres ?? [])
  const shared = [...ga].filter((g) => gb.has(g)).length
  const union = new Set([...ga, ...gb]).size
  const genre = union ? shared / union : 0
  return (tmdbLink ? SIMILAR_WEIGHT : 0) + GENRE_WEIGHT * genre
}

// Scores every unranked catalog movie. Returns [{ movie, score, because }]
// sorted best first, where `because` is the ranked movie that helped most.
// Only movies with a positive score are returned.
export function scoreCandidates(tiers, catalog) {
  const ranked = tiers.flat()
  const rankedIds = new Set(ranked.map((m) => m.id))
  const weights = positionWeights(tiers)
  const results = []

  for (const movie of catalog) {
    if (rankedIds.has(movie.id)) continue
    let score = 0
    let because = null
    let best = 0
    for (const r of ranked) {
      const contribution = weights.get(r.id) * relatedness(r, movie)
      score += contribution
      if (contribution > best) {
        best = contribution
        because = r
      }
    }
    if (score > 0) results.push({ movie, score, because })
  }

  // Ties broken by title so the order is stable between renders.
  return results.sort((a, b) => b.score - a.score || a.movie.title.localeCompare(b.movie.title))
}

// The recommendations page: a top-picks row plus "Because you ranked X
// highly" rows for the user's favorites. Movies don't repeat across rows.
// Returns { locked: true, remaining } until RECS_UNLOCK movies are ranked.
export function buildRecommendations(tiers, catalog, { unlockAt = RECS_UNLOCK, perRow = 6, becauseRows = 3 } = {}) {
  const count = tiers.reduce((n, tier) => n + tier.length, 0)
  if (count < unlockAt) return { locked: true, remaining: unlockAt - count }

  const scored = scoreCandidates(tiers, catalog)
  const used = new Set()
  const take = (items) => {
    const picked = items.filter((s) => !used.has(s.movie.id)).slice(0, perRow)
    picked.forEach((s) => used.add(s.movie.id))
    return picked
  }

  const rows = []
  const top = take(scored)
  if (top.length) rows.push({ id: 'top', title: 'Top picks for you', items: top })

  // Favorites = the user's top-ranked movies, best first.
  for (const fav of tiers.flat().slice(0, becauseRows)) {
    const related = scored.filter((s) => relatedness(fav, s.movie) > 0)
    const items = take(related)
    if (items.length) rows.push({ id: `because-${fav.id}`, title: `Because you ranked ${fav.title} highly`, items, because: fav })
  }

  return { locked: false, rows }
}
