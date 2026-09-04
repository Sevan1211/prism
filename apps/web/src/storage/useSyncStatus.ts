import { useSyncExternalStore } from 'react'
import { SYNC_CHANGED, syncStatus } from './syncedLibrary'
const subscribe = (listener: () => void) => { window.addEventListener(SYNC_CHANGED, listener); return () => window.removeEventListener(SYNC_CHANGED, listener) }
export const useSyncStatus = () => useSyncExternalStore(subscribe, syncStatus, syncStatus)
