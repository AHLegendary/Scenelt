import { useEffect, useState } from 'react'
import './App.css'
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
        {page === 'my-list' ? <MyListPage /> : <LeaderboardPage />}
      </main>
    </div>
  )
}

export default App
