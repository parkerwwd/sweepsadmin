'use client'

import { Button } from '@/components/ui/button'
import { User, LogOut } from 'lucide-react'
import { getAdminClient } from '@/lib/supabase-clients'
import { useRouter } from 'next/navigation'
import { useSite } from '../sweeps/SiteContext'
import { SWEEPS_SITES } from '@/lib/supabase-clients'

export function TopBar() {
  const router = useRouter()
  const { currentSite } = useSite()
  const supabase = getAdminClient()
  const site = SWEEPS_SITES[currentSite]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      teal: 'bg-teal-500',
    }
    return colors[color] || 'bg-gray-500'
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm sticky top-0 z-40">
      {/* Current Site Indicator */}
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${getColorClass(site.color)}`} />
        <span className="font-semibold text-gray-900">{site.name}</span>
      </div>
      
      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* User Profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium hidden sm:inline">Admin</span>

          {/* Logout */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="hover:bg-red-50 hover:text-red-600"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

