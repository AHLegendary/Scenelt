import { useEffect, useId, useRef } from 'react'
import Poster from './Poster.jsx'
import { tierRanks } from '../features/ranking/binaryInsertion.js'
import { scoreTiers } from '../features/ranking/scores.js'
import { getCommunityStats, imageUrl, posterUrl } from '../lib/localStore.js'
import { formatRuntime } from '../lib/movieDetails.js'
import { useMyTiers } from '../lib/useMyList.js'

// Details panel for one movie: backdrop, overview, credits, where the user
// ranked it, and how the community ranks it. Everything comes from the local
// catalog, so opening it makes no network calls besides loading images.
export default function MovieDetails({ movie, onClose, onRank, onRerank }) {
  const tiers = useMyTiers()
  const titleId = useId()
  const closeButton = useRef(null)

  const tierIndex = tiers.findIndex((tier) => tier.some((m) => m.id === movie.id))
  const ranked = tierIndex !== -1
  const count = tiers.reduce((n, tier) => n + tier.length, 0)
  const myRank = ranked ? tierRanks(tiers)[tierIndex] : null
  const myScore = ranked ? scoreTiers(tiers)?.get(movie.id) ?? null : null
  const tied = ranked && tiers[tierIndex].length > 1
  const community = getCommunityStats(movie.id)
  const runtime = formatRuntime(movie.runtime)
  const backdrop = imageUrl(movie.backdrop_path, 'w780')
  const facts = [movie.year, runtime, movie.genres?.join(', ')].filter(Boolean)

  useEffect(() => {
    closeButton.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="overlay overlay--top" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <article className="details" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="details__hero" style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}>
          <button ref={closeButton} type="button" className="dialog__close details__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="details__body">
          <div className="details__top">
            <Poster title={movie.title} src={posterUrl(movie, 'w342')} size="md" />
            <div className="details__heading">
              <h2 className="details__title" id={titleId}>{movie.title}</h2>
              <p className="details__facts">{facts.join(' · ')}</p>
              {movie.tagline && <p className="details__tagline">{movie.tagline}</p>}
            </div>
          </div>

          <div className="details__stats">
            <div className="stat">
              <span className="stat__label">Your rank</span>
              {ranked ? (
                <span className="stat__value">
                  #{myRank}
                  <small> of {count}{tied ? ' · tied' : ''}</small>
                </span>
              ) : (
                <span className="stat__value stat__value--muted">Not ranked</span>
              )}
            </div>
            {ranked && (
              <div className="stat">
                <span className="stat__label">Your score</span>
                <span className={`stat__value${myScore === null ? ' stat__value--muted' : ''}`}>
                  {myScore === null ? 'At 10 movies' : myScore.toFixed(1)}
                </span>
              </div>
            )}
            {(community.weekly || community.monthly) && (
              <div className="stat">
                <span className="stat__label">Community</span>
                <span className="stat__value">
                  {(community.weekly || community.monthly).score.toFixed(1)}
                  <small>
                    {' '}#{(community.weekly || community.monthly).rank} {community.weekly ? 'this week' : 'this month'}
                  </small>
                </span>
              </div>
            )}
          </div>

          {movie.overview && <p className="details__overview">{movie.overview}</p>}

          {(movie.directors?.length > 0 || movie.cast?.length > 0) && (
            <dl className="details__credits">
              {movie.directors?.length > 0 && (
                <div>
                  <dt>{movie.directors.length > 1 ? 'Directors' : 'Director'}</dt>
                  <dd>{movie.directors.join(', ')}</dd>
                </div>
              )}
              {movie.cast?.length > 0 && (
                <div>
                  <dt>Cast</dt>
                  <dd>{movie.cast.join(', ')}</dd>
                </div>
              )}
            </dl>
          )}

          <div className="details__actions">
            {ranked ? (
              count > 1 && (
                <button type="button" className="btn" onClick={() => onRerank(movie)}>
                  Rerank
                </button>
              )
            ) : (
              <button type="button" className="btn" onClick={() => onRank(movie)}>
                Rank it
              </button>
            )}
            {movie.tmdb_id && (
              <a className="details__tmdb" href={`https://www.themoviedb.org/movie/${movie.tmdb_id}`} target="_blank" rel="noreferrer">
                View on TMDB
              </a>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
