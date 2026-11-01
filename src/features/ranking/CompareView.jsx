import { useEffect, useId, useRef, useState } from 'react'
import Poster from '../../components/Poster.jsx'
import { posterUrl } from '../../lib/localStore.js'
import { getMyTiers, placeMovie } from '../../lib/supabaseStore.js'
import {
  answer,
  applyPlacement,
  finalPlacement,
  isDone,
  maxComparisons,
  NEW,
  nextOpponent,
  OPPONENT,
  startInsertion,
  TIE,
  tierRanks,
} from './binaryInsertion.js'
import { moviesUntilScores, scoreTiers } from './scores.js'

// Rank of a movie in a list of tiers, or null if it isn't there.
function rankOf(tiers, id) {
  const ranks = tierRanks(tiers)
  const at = tiers.findIndex((tier) => tier.some((m) => m.id === id))
  return at === -1 ? null : ranks[at]
}

// Full-screen head-to-head flow for placing one movie in My List: a newly
// watched movie, or one being reranked. The list is only saved once the last
// comparison is answered, so closing early leaves the ranking untouched.
// If the save fails, the result screen says so and offers a retry.
export default function CompareView({ movie, rerank = false, onClose, onRankAnother, onSeeList }) {
  // Snapshot the list once. When reranking, the movie is compared against
  // everything except itself.
  const [setup] = useState(() => {
    const current = getMyTiers()
    const others = current.map((tier) => tier.filter((m) => m.id !== movie.id)).filter((tier) => tier.length)
    return { oldRank: rerank ? rankOf(current, movie.id) : null, start: startInsertion(others, movie) }
  })
  const [history, setHistory] = useState([setup.start])
  const saveStarted = useRef(false)
  // 'saving' | 'saved' | 'failed'
  const [saveStatus, setSaveStatus] = useState('saving')
  const titleId = useId()

  const state = history[history.length - 1]
  const done = isDone(state)
  const opponent = nextOpponent(state)

  function choose(choice) {
    if (done) return
    setHistory((h) => [...h, answer(h[h.length - 1], choice)])
  }

  function undo() {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))
  }

  async function save() {
    setSaveStatus('saving')
    try {
      await placeMovie(movie.id, finalPlacement(state))
      setSaveStatus('saved')
    } catch {
      setSaveStatus('failed')
    }
  }

  // Save once, when the last comparison is answered. Retries go through save().
  useEffect(() => {
    if (done && !saveStarted.current) {
      saveStarted.current = true
      save()
    }
  })

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (done) return
      else if (e.key === 'ArrowLeft') choose(NEW)
      else if (e.key === 'ArrowRight') choose(OPPONENT)
      else if (e.key === 'ArrowDown' || e.key === '=') choose(TIE)
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
        <button type="button" className="dialog__close compare__close" onClick={onClose} aria-label="Close without saving">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        {done ? (
          <Placed
            titleId={titleId}
            movie={movie}
            tiers={applyPlacement(state.tiers, movie, finalPlacement(state))}
            tied={finalPlacement(state).tied}
            oldRank={setup.oldRank}
            saveStatus={saveStatus}
            onRetry={save}
            onRankAnother={onRankAnother}
            onSeeList={onSeeList}
          />
        ) : (
          <>
            <header className="compare__head">
              <h2 className="compare__title" id={titleId}>Which did you like more?</h2>
              <p className="compare__progress" aria-live="polite">
                Comparison {state.comparisons + 1} of up to {maxComparisons(state.tiers.length)}
              </p>
            </header>

            <div className="duel">
              <PickCard movie={movie} badge={rerank ? 'Reranking' : 'Just watched'} onPick={() => choose(NEW)} hint="←" />
              <span className="duel__vs" aria-hidden="true">vs</span>
              <PickCard key={opponent.id} movie={opponent} onPick={() => choose(OPPONENT)} hint="→" />
            </div>

            <footer className="compare__foot">
              <button type="button" className="ghost" onClick={undo} disabled={history.length === 1}>
                Undo
              </button>
              <button type="button" className="ghost ghost--tie" onClick={() => choose(TIE)}>
                It's a tie
                <kbd className="pick__key" aria-hidden="true">↓</kbd>
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

// Result screen: where the movie landed, its score once unlocked, and the
// movies around it for context.
function Placed({ titleId, movie, tiers, tied, oldRank, saveStatus, onRetry, onRankAnother, onSeeList }) {
  const ranks = tierRanks(tiers)
  const rows = tiers.flatMap((tier, i) => tier.map((m) => ({ movie: m, rank: ranks[i], tier: i })))
  const at = rows.findIndex((r) => r.movie.id === movie.id)
  const from = Math.max(0, Math.min(at - 1, rows.length - 3))
  const nearby = rows.slice(from, from + 3)
  const { rank, tier } = rows[at]
  const count = rows.length
  const tiedWith = tiers[tier].filter((m) => m.id !== movie.id)
  const scores = scoreTiers(tiers)
  const toUnlock = moviesUntilScores(count)

  let eyebrow = 'Ranked'
  let text = `${movie.title} is now #${rank} in your list.`
  if (count === 1) {
    eyebrow = 'First movie added'
    text = `${movie.title} starts your list. Add another and SceneIt will ask you to compare them.`
  } else if (tied) {
    eyebrow = 'Tied'
    text = `${movie.title} shares #${rank} with ${tiedWith.map((m) => m.title).join(', ')}.`
  } else if (oldRank !== null) {
    eyebrow = 'Reranked'
    text = oldRank === rank ? `${movie.title} stays at #${rank}.` : `${movie.title} moved from #${oldRank} to #${rank}.`
  }

  return (
    <div className="placed">
      <p className="placed__eyebrow">{eyebrow}</p>
      <h2 className="placed__rank" id={titleId}>
        #{rank}
        <span> of {count}</span>
      </h2>
      <p className="placed__text">{text}</p>
      {scores ? (
        <p className="placed__score">
          Score <strong>{scores.get(movie.id).toFixed(1)}</strong>
        </p>
      ) : (
        <p className="placed__unlock">
          Rank {toUnlock} more {toUnlock === 1 ? 'movie' : 'movies'} to unlock scores
        </p>
      )}

      <ol className="placed__list">
        {nearby.map((r) => (
          <li key={r.movie.id} className={r.movie.id === movie.id ? 'is-new' : undefined}>
            <span className="placed__num">{r.rank}</span>
            <Poster title={r.movie.title} src={posterUrl(r.movie, 'w154')} size="sm" />
            <span className="placed__name">{r.movie.title}</span>
            {scores && <span className="placed__val">{scores.get(r.movie.id).toFixed(1)}</span>}
          </li>
        ))}
      </ol>

      {saveStatus === 'saving' && (
        <p className="placed__save" role="status">Saving…</p>
      )}
      {saveStatus === 'failed' && (
        <div className="notice notice--error" role="alert">
          <span>Couldn't save your ranking. Check your connection and try again.</span>
          <button type="button" className="btn btn--sm" onClick={onRetry} autoFocus>Try again</button>
        </div>
      )}

      <div className="placed__actions">
        {onRankAnother ? (
          <>
            <button type="button" className="btn btn--light" onClick={onSeeList} disabled={saveStatus !== 'saved'}>
              See my list
            </button>
            <button type="button" className="btn" onClick={onRankAnother} disabled={saveStatus !== 'saved'} autoFocus>
              Rank another
            </button>
          </>
        ) : (
          <button type="button" className="btn" onClick={onSeeList} disabled={saveStatus !== 'saved'} autoFocus>
            Done
          </button>
        )}
      </div>
    </div>
  )
}
