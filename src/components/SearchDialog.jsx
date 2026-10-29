import { useEffect, useId, useRef, useState } from 'react'
import Poster from './Poster.jsx'
import { addMovie, getSuggestions, posterUrl, searchMovies } from '../lib/localStore.js'
import { useMyList } from '../lib/useMyList.js'

// Search the local movie catalog and add movies to My List.
// Esc or clicking outside closes it.
export default function SearchDialog({ onClose }) {
  const [query, setQuery] = useState('')
  const list = useMyList()
  const input = useRef(null)
  const titleId = useId()

  const inList = new Set(list.map((m) => m.id))
  const trimmed = query.trim()
  const results = trimmed ? searchMovies(trimmed) : getSuggestions()

  useEffect(() => {
    input.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    // keep the page behind from scrolling while the dialog is open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="dialog__head">
          <h2 className="dialog__title" id={titleId}>Add a movie</h2>
          <button type="button" className="dialog__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <label className="search">
          <svg className="search__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <input
            ref={input}
            className="search__input"
            type="search"
            placeholder="Search for a movie you've watched"
            aria-label="Search movies"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
        </label>

        <p className="dialog__section" aria-live="polite">
          {trimmed
            ? results.length
              ? `${results.length} ${results.length === 1 ? 'result' : 'results'}`
              : ''
            : 'Popular this week'}
        </p>

        {trimmed && results.length === 0 ? (
          <p className="dialog__empty">No movies match “{trimmed}”. Try another title.</p>
        ) : (
          <ul className="results">
            {results.map((movie) => {
              const added = inList.has(movie.id)
              return (
                <li className="result" key={movie.id}>
                  <Poster title={movie.title} src={posterUrl(movie, 'w154')} size="sm" />
                  <div className="row__info">
                    <span className="row__title">{movie.title}</span>
                    <span className="row__meta">
                      {movie.year} · {movie.genres.join(', ')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`btn btn--sm${added ? ' is-done' : ''}`}
                    disabled={added}
                    onClick={() => addMovie(movie.id)}
                    aria-label={added ? `${movie.title} is in your list` : `Add ${movie.title}`}
                  >
                    {added ? 'Added' : 'Add'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
