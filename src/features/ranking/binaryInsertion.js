// Head-to-head placement using binary insertion.
//
// The ranked list is ordered best first. To place a new movie we compare it
// with the middle of the range where it could still go, and halve that range
// after every answer. Placing a movie into a list of n movies takes at most
// ceil(log2(n + 1)) comparisons.
//
// The state is a plain object so the UI can drive it one answer at a time,
// undo by keeping earlier states, and throw it away to cancel.

// Most comparisons a list of n movies can need.
export function maxComparisons(n) {
  return Math.ceil(Math.log2(n + 1))
}

export function startInsertion(list, item) {
  if (list.some((x) => x.id === item.id)) {
    throw new Error(`${item.id} is already ranked`)
  }
  return { list, item, lo: 0, hi: list.length, comparisons: 0 }
}

export function isDone(state) {
  return state.lo >= state.hi
}

// The movie the new one should be compared against next, or null when done.
export function nextOpponent(state) {
  if (isDone(state)) return null
  return state.list[Math.floor((state.lo + state.hi) / 2)]
}

// prefersNew: true if the user liked the new movie more than the opponent.
export function answer(state, prefersNew) {
  if (isDone(state)) throw new Error('Insertion is already finished')
  const mid = Math.floor((state.lo + state.hi) / 2)
  return {
    ...state,
    lo: prefersNew ? state.lo : mid + 1,
    hi: prefersNew ? mid : state.hi,
    comparisons: state.comparisons + 1,
  }
}

// Final index for the new movie (0 = best). Only valid once done.
export function finalPosition(state) {
  if (!isDone(state)) throw new Error('Insertion is not finished yet')
  return state.lo
}

// Runs a whole insertion with a callback that answers each comparison.
// prefers(newMovie, opponent) -> true if the new movie is liked more.
// Used by tests and anywhere the answers are already known.
export function insertWith(list, item, prefers) {
  let state = startInsertion(list, item)
  while (!isDone(state)) state = answer(state, prefers(item, nextOpponent(state)))
  const position = finalPosition(state)
  return {
    position,
    comparisons: state.comparisons,
    list: [...list.slice(0, position), item, ...list.slice(position)],
  }
}
