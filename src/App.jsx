import { useCallback, useEffect, useState } from 'react'
import './App.css'
import SearchDialog from './components/SearchDialog.jsx'
import CompareView from './features/ranking/CompareView.jsx'
import Sidebar from './components/Sidebar.jsx'
import { PAGES } from './lib/pages.js'
import LeaderboardPage from './pages/LeaderboardPage.jsx'
import MyListPage from './pages/MyListPage.jsx'

const DEFAULT_PAGE = 'leaderboard'

// Pages live in the URL hash (#/my-list) so refresh and back/forward work
// without a router or any server config on Vercel.
function pageFromHash() {
  const id = window.location.hash.replace(/^#\/?/, '')
  return PAGES.some((p) => p.id === id) ? id : DEFAULT_PAGE
}

function App() {
  const [page, setPage] = useState(pageFromHash)
  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  // Movie being placed head-to-head: { movie, rerank }
  const [ranking, setRanking] = useState(null)
  const [justRanked, setJustRanked] = useState(null)

  // Picking a movie in search starts the head-to-head flow for it.
  function startRanking(movie) {
    setSearchOpen(false)
    setRanking({ movie, rerank: false })
  }

  function startRerank(movie) {
    setRanking({ movie, rerank: true })
  }

  function finishRanking({ next }) {
    setJustRanked(ranking.movie.id)
    setRanking(null)
    if (next === 'search') setSearchOpen(true)
    else navigate('my-list')
  }

  useEffect(() => {
    const onHash = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function navigate(id) {
    window.location.hash = `/${id}`
  }

  return (
    <div className="app">
      <Sidebar current={page} onNavigate={navigate} />
      <main className="main">
        <div className="topbar">
          <span className="guest" title="You're browsing as a guest. Your list is saved in this browser.">
            <span className="guest__dot" aria-hidden="true" />
            Guest
          </span>
        </div>
        {page === 'my-list' ? <MyListPage onAdd={openSearch} onRerank={startRerank} highlightId={justRanked} /> : <LeaderboardPage />}
        <footer className="credit">
          Movie data from <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">TMDB</a>.
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </footer>
      </main>
      {searchOpen && <SearchDialog onClose={closeSearch} onPick={startRanking} />}
      {ranking && (
        <CompareView
          key={`${ranking.movie.id}-${ranking.rerank}`}
          movie={ranking.movie}
          rerank={ranking.rerank}
          onClose={() => setRanking(null)}
          onRankAnother={ranking.rerank ? undefined : () => finishRanking({ next: 'search' })}
          onSeeList={() => finishRanking({ next: 'list' })}
        />
      )}
    </div>
  )
}

export default App
