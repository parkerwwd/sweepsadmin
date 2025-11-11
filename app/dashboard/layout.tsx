'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { SiteProvider } from '@/components/sweeps/SiteContext'
import { getAdminClient } from '@/lib/supabase-clients'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    
    const checkAuth = async () => {
      try {
        console.log('Dashboard: Checking auth...')
        
        const supabase = getAdminClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        console.log('Dashboard: User check result:', { user: user?.email, error: error?.message })
        
        if (!mounted) return // Component unmounted, don't update state
        
        if (error || !user) {
          console.log('Dashboard: No user or error, redirecting to login')
          // Don't set loading false, just redirect
          window.location.replace('/login')
          return
        }
        
        // Check if user is in admin whitelist
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) || ['parker@worldwidedigital.com']
        
        console.log('Dashboard: Checking whitelist:', { userEmail: user.email, adminEmails })
        
        if (!adminEmails.includes(user.email || '')) {
          console.log('Dashboard: User not in whitelist, signing out')
          await supabase.auth.signOut()
          window.location.replace('/login')
          return
        }
        
        console.log('Dashboard: Auth successful!')
        setUser(user)
        setLoading(false)
      } catch (error) {
        console.error('Dashboard: Auth check error:', error)
        if (mounted) {
          window.location.replace('/login')
        }
      }
    }
    
    checkAuth()
    
    return () => {
      mounted = false
    }
  }, []) // Only run once on mount

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="inline-block h-10 w-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SiteProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <TopBar />
            <main className="flex-1 p-8">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </SiteProvider>
  )
}

