import { createContext, useContext } from 'react'
import { useAppState } from '../hooks/useAppState'

type AppState = ReturnType<typeof useAppState>

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const state = useAppState()
  return <AppContext.Provider value={state}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppContext must be used within AppProvider")
  return ctx
}
