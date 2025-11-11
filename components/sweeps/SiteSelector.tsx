'use client'

import { useSite } from './SiteContext'
import { SWEEPS_SITES, SITE_IDS } from '@/lib/supabase-clients'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function SiteSelector() {
  const { currentSite, setCurrentSite } = useSite()
  
  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      teal: 'bg-teal-500',
    }
    return colors[color] || 'bg-gray-500'
  }
  
  return (
    <Select value={currentSite} onValueChange={(value) => setCurrentSite(value as any)}>
      <SelectTrigger className="h-12 bg-white shadow-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SITE_IDS.map((siteId) => {
          const site = SWEEPS_SITES[siteId]
          return (
            <SelectItem key={siteId} value={siteId}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${getColorClass(site.color)}`} />
                {site.name}
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

