import { useMemo } from 'react'
import Poster from '../components/Poster.jsx'
import { buildRecommendations, RECS_UNLOCK } from '../features/recommendations/recommend.js'
import { getCatalog, posterUrl } from '../lib/localStore.js'
import { useMyTiers } from '../lib/useMyList.js'

// Personalized recommendations, unlocked at 15 ranked movies. Cards open the
// movie details panel, where the user can rank them.
export default function ForYouPage({ onOpen, onAdd }) {
  const tiers = useMyTiers()
  const recs = useMemo(() => buildRecommendations(tiers, getCatalog()), [tiers])
  const count = tiers.reduce((n, tier) => n + tier.length, 0)

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <h1 className="page__title">For You</h1>
          <p className="page__sub">Picked from how you've ranked movies so far.</p>
        </div>
      </header>

      {recs.locked ? (
        <div className="empty">
          <div className="empty__stack" aria-hidden="true">
            <span /><span /><span />
          </div>
          <h2 className="empty__title">
            Rank {recs.remaining} more {recs.remaining === 1 ? 'movie' : 'movies'} to unlock recommendations
          </h2>
          <p className="empty__text">
            Once you've ranked {RECS_UNLOCK}, SceneIt suggests movies based on what you put at the top
            of your list, and steers away from what you put at the bottom.
          </p>
          <div
            className="unlock__bar unlock__bar--wide"
            role="progressbar"
            aria-label="Movies ranked toward recommendations"
            aria-valuemin={0}
            aria-valuemax={RECS_UNLOCK}
            aria-valuenow={count}
          >
            <span style={{ width: `${(count / RECS_UNLOCK) * 100}%` }} />
          </div>
          <p className="empty__note">{count} of {RECS_UNLOCK} ranked</p>
          <button type="button" className="btn" onClick={onAdd}>
            Rank a movie
          </button>
        </div>
      ) : recs.rows.length === 0 ? (
        <div className="empty">
          <h2 className="empty__title">Nothing new to suggest</h2>
          <p className="empty__text">You've ranked everything we'd recommend from the demo catalog. Impressive.</p>
        </div>
      ) : (
        recs.rows.map((row) => (
          <section className="recs" key={row.id} aria-label={row.title}>
            <h2 className="recs__title">{row.title}</h2>
            <ul className="recs__grid">
              {row.items.map(({ movie, because }) => (
                <li key={movie.id}>
                  <button type="button" className="rec" onClick={() => onOpen(movie.id)}>
                    <Poster title={movie.title} src={posterUrl(movie, 'w342')} size="md" />
                    <span className="rec__title">{movie.title}</span>
                    <span className="rec__meta">
                      {row.id === 'top' && because ? `Because you liked ${because.title}` : movie.year}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  )
}
