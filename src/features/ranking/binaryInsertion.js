// Head-to-head placement using binary insertion, with ties.
//
// A ranked list is a list of tiers, best first. Most tiers hold one movie;
// tied movies share a tier (and a position). To place a new movie we compare
// it with a movie from the middle tier of the range where it could still go,
// and halve that range after every answer. Answering "tie" puts it in that
// tier right away.
//
// Placing a movie into a list with t tiers takes at most ceil(log2(t + 1))
// comparisons, and t is never more than the number of movies.
//
// The state is a plain object so the UI can drive it one answer at a time,
// undo by keeping earlier states, and throw it away to cancel.

export const NEW = 'new' // the new movie was liked more
export const OPPONENT = 'opponent' // the movie already in the list was liked more
export const TIE = 'tie' // liked them about the same

// Most comparisons a list of n movies (or tiers) can need.
export function maxComparisons(n) {
  return Math.ceil(Math.log2(n + 1))
}

// Accepts a flat list ([a, b, c]) or tiers ([[a], [b, c]]).
export function toTiers(list) {
  return list.map((entry) => (Array.isArray(entry) ? entry : [entry])).filter((tier) => tier.length > 0)
}

export function startInsertion(list, item) {
  const tiers = toTiers(list)
  if (tiers.some((tier) => tier.some((x) => x.id === item.id))) {
    throw new Error(`${item.id} is already ranked`)
  }
  return { tiers, item, lo: 0, hi: tiers.length, comparisons: 0, tiedAt: null }
}

export function isDone(state) {
  return state.tiedAt !== null || state.lo >= state.hi
}

function midpoint(state) {
  return Math.floor((state.lo + state.hi) / 2)
}

// The movie the new one should be compared against next, or null when done.
export function nextOpponent(state) {
  if (isDone(state)) return null
  return state.tiers[midpoint(state)][0]
}

// choice: NEW, OPPONENT or TIE. true / false also work for NEW / OPPONENT.
export function answer(state, choice) {
  if (isDone(state)) throw new Error('Insertion is already finished')
  const pick = choice === true ? NEW : choice === false ? OPPONENT : choice
  const mid = midpoint(state)
  const next = { ...state, comparisons: state.comparisons + 1 }
  if (pick === TIE) return { ...next, tiedAt: mid }
  if (pick === NEW) return { ...next, hi: mid }
  if (pick === OPPONENT) return { ...next, lo: mid + 1 }
  throw new Error(`Unknown choice: ${choice}`)
}

// Where the movie ends up: { index, tied }.
// tied = false: a new tier at `index` (0 = best).
// tied = true: joins the existing tier at `index`.
export function finalPlacement(state) {
  if (!isDone(state)) throw new Error('Insertion is not finished yet')
  return state.tiedAt !== null ? { index: state.tiedAt, tied: true } : { index: state.lo, tied: false }
}

// Index of the movie's tier once placed. Kept for callers that only need where it landed.
export function finalPosition(state) {
  return finalPlacement(state).index
}

// Tiers after applying a placement. Doesn't change the input.
export function applyPlacement(tiers, item, { index, tied }) {
  if (tied) return tiers.map((tier, i) => (i === index ? [...tier, item] : tier))
  return [...tiers.slice(0, index), [item], ...tiers.slice(index)]
}

// 1-based rank of each tier: tied movies share a rank and the next rank skips
// ahead (1, 2, 2, 4), like a sports table.
export function tierRanks(tiers) {
  const ranks = []
  let rank = 1
  for (const tier of tiers) {
    ranks.push(rank)
    rank += tier.length
  }
  return ranks
}

// Runs a whole insertion with a callback that answers each comparison.
// choose(newMovie, opponent) -> NEW, OPPONENT, TIE (or true / false).
// Used by tests and anywhere the answers are already known.
export function insertWith(list, item, choose) {
  let state = startInsertion(list, item)
  while (!isDone(state)) state = answer(state, choose(item, nextOpponent(state)))
  const placement = finalPlacement(state)
  const tiers = applyPlacement(state.tiers, item, placement)
  return {
    position: placement.index,
    tied: placement.tied,
    comparisons: state.comparisons,
    tiers,
    list: tiers.flat(),
  }
}
