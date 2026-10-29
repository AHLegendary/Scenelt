import { useMemo, useSyncExternalStore } from 'react'
import { getListKey, getMyList, getMyTiers, subscribe } from './localStore.js'

// The guest's ranked list, kept in sync with localStorage.
// Re-renders only when the stored list actually changes.
function useListKey() {
  return useSyncExternalStore(subscribe, getListKey)
}

// Flat list of movies, best first.
export function useMyList() {
  const key = useListKey()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- key is the change marker
  return useMemo(() => getMyList(), [key])
}

// Tiers of movies, best first; tied movies share a tier.
export function useMyTiers() {
  const key = useListKey()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- key is the change marker
  return useMemo(() => getMyTiers(), [key])
}
