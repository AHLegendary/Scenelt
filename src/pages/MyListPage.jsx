import Poster from '../components/Poster.jsx'
import { getMyList } from '../lib/localStore.js'

// The guest's own ranked list. Starts empty; "Add a movie" opens search
// (onAdd is wired up once movie search lands).
export default function MyListPage({ onAdd }) {
  const list = getMyList()

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <h1 className="page__title">My List</h1>
          <p className="page__sub">
            {list.length
              ? `${list.length} ranked ${list.length === 1 ? 'movie' : 'movies'}`
              : 'Every movie you rank lands here, best at the top.'}
          </p>
        </div>
        {list.length > 0 && (
          <button type="button" className="btn" onClick={onAdd} disabled={!onAdd}>
            Add a movie
          </button>
        )}
      </header>

      {list.length === 0 ? (
        <div className="empty">
          <div className="empty__stack" aria-hidden="true">
            <span /><span /><span />
          </div>
          <h2 className="empty__title">Your list is empty</h2>
          <p className="empty__text">
            Add a movie you've watched to start your ranking. After the first one,
            SceneIt asks you to compare each new movie head-to-head.
          </p>
          <button type="button" className="btn" onClick={onAdd} disabled={!onAdd}>
            Add a movie
          </button>
          {!onAdd && <p className="empty__note">Movie search is on the way.</p>}
        </div>
      ) : (
        <ol className="board">
          {list.map((movie, i) => (
            <li className="row" key={movie.id}>
              <span className="row__rank">{i + 1}</span>
              <Poster title={movie.title} src={movie.poster} size="sm" />
              <div className="row__info">
                <span className="row__title">{movie.title}</span>
                <span className="row__meta">{movie.year}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
