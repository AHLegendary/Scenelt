import { useEffect, useId, useRef, useState } from 'react'
import Poster from '../../components/Poster.jsx'
import { getMyList, insertMovie, posterUrl } from '../../lib/localStore.js'
import {
  answer,
  finalPosition,
  isDone,
  maxComparisons,
  nextOpponent,
  startInsertion,
} from './binaryInsertion.js'

// Full-screen head-to-head flow for placing one movie into My List.
// The list is only saved once the last comparison is answered, so closing
// early leaves the existing ranking untouched.
export default function CompareView({ movie, onClose, onRankAnother, onSeeList }) {
  // Snapshot the list once; the ranking is computed against this version.
  const [history, setHistory] = useState(() => [startInsertion(getMyList(), movie)])
  const saved = useRef(false)
  const titleId = useId()

  const state = history[history.length - 1]
  const done = isDone(state)
  const opponent = nextOpponent(state)
  const total = state.list.length

  function choose(prefersNew) {
    if (done) return
    setHistory((h) => [...h, answer(h[h.length - 1], prefersNew)])
  }

  function undo() {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))
  }

  // Save exactly once, when the last comparison is answered.
  useEffect(() => {
    if (done && !saved.current) {
      saved.current = true
      insertMovie(movie.id, finalPosition(state))
    }
  }, [done, movie.id, state])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (!done && e.key === 'ArrowLeft') choose(true)
      else if (!done && e.key === 'ArrowRight') choose(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  })

  return (
    <div className="overlay overlay--solid">
      <div className="compare" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="dialog__close compare__close" onClick={onClose} aria-label="Close without ranking">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        {done ? (
          <Placed
            titleId={titleId}
            movie={movie}
            position={finalPosition(state)}
            list={state.list}
            onRankAnother={onRankAnother}
            onSeeList={onSeeList}
          />
        ) : (
          <>
            <header className="compare__head">
              <h2 className="compare__title" id={titleId}>Which did you like more?</h2>
              <p className="compare__progress" aria-live="polite">
                Comparison {state.comparisons + 1} of up to {maxComparisons(total)}
              </p>
            </header>

            <div className="duel">
              <PickCard movie={movie} badge="Just watched" onPick={() => choose(true)} hint="←" />
              <span className="duel__vs" aria-hidden="true">vs</span>
              <PickCard key={opponent.id} movie={opponent} onPick={() => choose(false)} hint="→" />
            </div>

            <footer className="compare__foot">
              <button type="button" className="ghost" onClick={undo} disabled={history.length === 1}>
                Undo
              </button>
              <span className="compare__keys">Tap a poster, or use ← →</span>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}

function PickCard({ movie, badge, onPick, hint }) {
  return (
    <button type="button" className="pick" onClick={onPick} aria-label={`I liked ${movie.title} more`}>
      {badge && <span className="pick__badge">{badge}</span>}
      <Poster title={movie.title} src={posterUrl(movie, 'w342')} size="lg" />
      <span className="pick__title">{movie.title}</span>
      <span className="pick__meta">
        {movie.year}
        <kbd className="pick__key" aria-hidden="true">{hint}</kbd>
      </span>
    </button>
  )
}

// Result screen: where the movie landed, with its neighbors for context.
function Placed({ titleId, movie, position, list, onRankAnother, onSeeList }) {
  const ranked = [...list.slice(0, position), movie, ...list.slice(position)]
  const from = Math.max(0, Math.min(position - 1, ranked.length - 3))
  const nearby = ranked.slice(from, from + 3)
  const first = list.length === 0

  return (
    <div className="placed">
      <p className="placed__eyebrow">{first ? 'First movie added' : 'Ranked'}</p>
      <h2 className="placed__rank" id={titleId}>
        #{position + 1}
        <span> of {ranked.length}</span>
      </h2>
      <p className="placed__text">
        {first
          ? `${movie.title} starts your list. Add another and SceneIt will ask you to compare them.`
          : `${movie.title} is now #${position + 1} in your list.`}
      </p>

      <ol className="placed__list">
        {nearby.map((m) => (
          <li key={m.id} className={m.id === movie.id ? 'is-new' : undefined}>
            <span className="placed__num">{ranked.indexOf(m) + 1}</span>
            <Poster title={m.title} src={posterUrl(m, 'w154')} size="sm" />
            <span className="placed__name">{m.title}</span>
          </li>
        ))}
      </ol>

      <div className="placed__actions">
        <button type="button" className="btn btn--light" onClick={onSeeList}>See my list</button>
        <button type="button" className="btn" onClick={onRankAnother} autoFocus>Rank another</button>
      </div>
    </div>
  )
}
