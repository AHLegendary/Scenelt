import { PAGES } from '../lib/pages.js'

// Left-hand navigation. Big tab labels; the active page gets the filled pill.

export default function Sidebar({ current, onNavigate }) {
  return (
    <nav className="sidebar" aria-label="Main">
      <span className="logo">
        <img className="logo__mark" src="/favicon.svg" alt="" width="28" height="28" />
        SceneIt
      </span>
      <div className="sidebar__tabs">
        {PAGES.map((page) => (
          <button
            key={page.id}
            type="button"
            className={`sidebar__tab${current === page.id ? ' is-active' : ''}`}
            aria-current={current === page.id ? 'page' : undefined}
            onClick={() => onNavigate(page.id)}
          >
            {page.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
