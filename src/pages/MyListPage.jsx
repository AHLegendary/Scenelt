import Poster from '../components/Poster.jsx'
import { tierRanks } from '../features/ranking/binaryInsertion.js'
import { moviesUntilScores, SCORE_UNLOCK, scoreTiers } from '../features/ranking/scores.js'
import { posterUrl, removeMovie } from '../lib/localStore.js'
import { useMyTiers } from '../lib/useMyList.js'

// The guest's own ranked list. Starts empty; "Rank a movie" opens search.
// Tied movies share a rank. Scores appear once 10+ movies are ranked.
// highlightId briefly marks the movie that was just ranked.
export default function MyListPage({ onAdd, onRerank, highlightId }) {
  const tiers = useMyTiers()
  const ranks = tierRanks(tiers)
  const count = tiers.reduce((n, tier) => n + tier.length, 0)
  const scores = scoreTiers(tiers)
  const toUnlock = moviesUntilScores(count)

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <h1 className="page__title">My List</h1>
          <p className="page__sub">
            {count
              ? `${count} ranked ${count === 1 ? 'movie' : 'movies'}`
              : 'Every movie you rank lands here, best at the top.'}
          </p>
        </div>
        {count > 0 && (
          <button type="button" className="btn" onClick={onAdd}>
            Rank a movie
          </button>
        )}
      </header>

      {count > 0 && !scores && (
        <div className="unlock" role="status">
          <div className="unlock__text">
            <strong>Rank {toUnlock} more {toUnlock === 1 ? 'movie' : 'movies'} to unlock scores</strong>
            <span>Once you've ranked {SCORE_UNLOCK}, every movie gets a score out of 10 based on where it sits.</span>
          </div>
          <div
            className="unlock__bar"
            role="progressbar"
            aria-label="Movies ranked toward scores"
            aria-valuemin={0}
            aria-valuemax={SCORE_UNLOCK}
            aria-valuenow={count}
          >
            <span style={{ width: `${(count / SCORE_UNLOCK) * 100}%` }} />
          </div>
        </div>
      )}

      {count === 0 ? (
        <div className="empty">
          <div className="empty__stack" aria-hidden="true">
            <span /><span /><span />
          </div>
          <h2 className="empty__title">Your list is empty</h2>
          <p className="empty__text">
            Add a movie you've watched to start your ranking. After the first one,
            SceneIt asks you to compare each new movie head-to-head.
          </p>
          <button type="button" className="btn" onClick={onAdd}>
            Rank a movie
          </button>
        </div>
      ) : (
        <ol className="board">
          {tiers.map((tier, t) =>
            tier.map((movie, k) => {
              const isTied = tier.length > 1
              const classes = ['row', 'row--mine']
              if (isTied) classes.push('is-tied')
              if (isTied && k === 0) classes.push('is-tie-start')
              if (isTied && k === tier.length - 1) classes.push('is-tie-end')
              if (movie.id === highlightId) classes.push('is-new')
              return (
                <li className={classes.join(' ')} key={movie.id}>
                  <span className="row__rank">{ranks[t]}</span>
                  <Poster title={movie.title} src={posterUrl(movie, 'w154')} size="sm" />
                  <div className="row__info">
                    <span className="row__title">{movie.title}</span>
                    <span className="row__meta">
                      {movie.year}
                      {isTied && <span className="chip">Tied</span>}
                    </span>
                  </div>
                  <div className="row__end">
                    <div className="row__actions">
                      {count > 1 && (
                        <button type="button" className="row__btn" onClick={() => onRerank(movie)} aria-label={`Rerank ${movie.title}`}>
                          Rerank
                        </button>
                      )}
                      <button type="button" className="row__btn" onClick={() => removeMovie(movie.id)} aria-label={`Remove ${movie.title}`}>
                        Remove
                      </button>
                    </div>
                    {scores && (
                      <div className="row__stat">
                        <span className="row__value">{scores.get(movie.id).toFixed(1)}</span>
                        <span className="row__label">score</span>
                      </div>
                    )}
                  </div>
                </li>
              )
            }),
          )}
        </ol>
      )}
    </section>
  )
}
