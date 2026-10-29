import { useState } from 'react'
import Poster from '../components/Poster.jsx'
import Segmented from '../components/Segmented.jsx'
import { getLeaderboard } from '../lib/localStore.js'

const PERIOD_OPTIONS = [
  { id: 'weekly', label: 'This week' },
  { id: 'monthly', label: 'This month' },
]
const CATEGORY_OPTIONS = [
  { id: 'highest', label: 'Highest ranked' },
  { id: 'watched', label: 'Most watched' },
]

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('weekly')
  const [category, setCategory] = useState('highest')
  const rows = getLeaderboard(period, category)

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <h1 className="page__title">Leaderboard</h1>
          <p className="page__sub">What the SceneIt community is ranking right now.</p>
        </div>
        <div className="page__controls">
          <Segmented label="Time period" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
          <Segmented label="Sort by" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
        </div>
      </header>

      <ol className="board" key={`${period}-${category}`}>
        {rows.map((movie) => (
          <li className={`row${movie.rank <= 3 ? ' is-top' : ''}`} key={movie.id}>
            <span className="row__rank">{movie.rank}</span>
            <Poster title={movie.title} size="sm" />
            <div className="row__info">
              <span className="row__title">{movie.title}</span>
              <span className="row__meta">{movie.year}</span>
            </div>
            <div className="row__stat">
              {category === 'watched' ? (
                <>
                  <span className="row__value">{movie.rankers.toLocaleString()}</span>
                  <span className="row__label">rankers</span>
                </>
              ) : (
                <>
                  <span className="row__value">{movie.score.toFixed(1)}</span>
                  <span className="row__label">score</span>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
