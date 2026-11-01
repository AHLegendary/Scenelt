import { useMemo, useSyncExternalStore } from 'react'
import { getState, subscribe } from './supabaseStore.js'

// Login status, username and ranked list from supabaseStore.
// Re-renders whenever any of them changes.
export function useAccount() {
  return useSyncExternalStore(subscribe, getState)
}

// Tiers of movies, best first; tied movies share a tier.
export function useMyTiers() {
  return useAccount().tiers
}

// Flat list of movies, best first.
export function useMyList() {
  const tiers = useMyTiers()
  return useMemo(() => tiers.flat(), [tiers])
}