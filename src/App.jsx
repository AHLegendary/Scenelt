import './App.css'

const features = [
  {
    title: 'Head-to-head rankings',
    text: 'Pick between two movies at a time and build a ranking that actually reflects your taste.',
  },
  {
    title: 'Movie Blend',
    text: 'Find something everyone in your group will want to watch.',
  },
  {
    title: 'Reviews and friends',
    text: "Write reviews, follow friends, and see what they're ranking.",
  },
]

function App() {
  return (
    <div className="page">
      <header className="nav">
        <span className="logo">SceneIt</span>
      </header>

      <main className="hero">
        <p className="badge">Coming soon</p>
        <h1>Rank movies by what you actually like.</h1>
        <p className="tagline">
          No more star ratings. SceneIt builds your personal movie ranking
          through quick head-to-head comparisons.
        </p>
      </main>

      <section className="features">
        {features.map((f) => (
          <div className="card" key={f.title}>
            <h2>{f.title}</h2>
            <p>{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="footer">SceneIt · CSE 403 project</footer>
    </div>
  )
}

export default App