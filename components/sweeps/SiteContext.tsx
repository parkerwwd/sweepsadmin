'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type SiteId = 'anytrivia' | 'ccs' | 'mgs'

interface SiteContextType {
  currentSite: SiteId
  setCurrentSite: (site: SiteId) => void
}

const SiteContext = createContext<SiteContextType>({
  currentSite: 'anytrivia',
  setCurrentSite: () => {}
})

export function SiteProvider({ children }: { children: ReactNode }) {
  const [currentSite, setCurrentSite] = useState<SiteId>('anytrivia')
  
  return (
    <SiteContext.Provider value={{ currentSite, setCurrentSite }}>
      {children}
    </SiteContext.Provider>
  )
}

export const useSite = () => useContext(SiteContext)

