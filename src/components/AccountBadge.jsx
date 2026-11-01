import { useState } from 'react'
import { signOut } from '../lib/supabaseStore.js'

// Top-right account status: who's logged in, with a log out button.
export default function AccountBadge({ account }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function logOut() {
    setBusy(true)
    setError(null)
    try {
      await signOut()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (account.status === 'loading' && !account.user) return null

  if (!account.user) {
    return (
      <span className="account">
        <span className="account__dot" aria-hidden="true" />
        Not logged in
      </span>
    )
  }

  return (
    <div className="account-wrap">
      {error && <span className="account__error" role="alert">{error}</span>}
      <span className="account account--in">
        <span className="account__dot" aria-hidden="true" />
        {account.username ?? 'Logged in'}
      </span>
      <button type="button" className="row__btn" onClick={logOut} disabled={busy}>
        {busy ? 'Logging out…' : 'Log out'}
      </button>
    </div>
  )
}
