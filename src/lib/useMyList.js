import { useMemo, useSyncExternalStore } from 'react'
import { getListKey, getMyList, subscribe } from './localStore.js'

// The guest's ranked list, kept in sync with localStorage.
// Re-renders only when the stored list actually changes.
export function useMyList() {
  const key = useSyncExternalStore(subscribe, getListKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- key is the change marker
  return useMemo(() => getMyList(), [key])
}
