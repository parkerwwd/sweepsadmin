'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Gift,
  FileText,
  Trophy,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SiteSelector } from '../sweeps/SiteSelector'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Giveaways', href: '/dashboard/giveaways', icon: Gift },
  { name: 'Entries', href: '/dashboard/entries', icon: FileText },
  { name: 'Winners', href: '/dashboard/winners', icon: Trophy },
  { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-72 min-h-screen bg-gradient-to-b from-slate-50 to-white border-r border-gray-200">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 shadow-md">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Sweeps Admin
            </h1>
            <p className="text-xs text-muted-foreground">Multi-Site Manager</p>
          </div>
        </div>
      </div>

      {/* Site Selector */}
      <div className="p-4 border-b border-gray-200">
        <label className="text-xs font-semibold text-gray-600 mb-2 block">Current Site</label>
        <SiteSelector />
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-white hover:shadow-sm'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

