'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Gift, Trophy, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useSite } from '@/components/sweeps/SiteContext'
import { getSweepsClient, SWEEPS_SITES, SITE_IDS } from '@/lib/supabase-clients'
import type { SweepsStats } from '@/lib/types'

export default function DashboardOverview() {
  const { currentSite } = useSite()
  const [stats, setStats] = useState<SweepsStats>({
    totalEntries: 0,
    todayEntries: 0,
    activeGiveaways: 0,
    totalWinners: 0,
  })
  const [siteStats, setSiteStats] = useState<Record<string, SweepsStats>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [currentSite])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const client = getSweepsClient(currentSite)
      
      // Get today's date at midnight
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Fetch stats for current site
      const [entriesResult, todayEntriesResult, giveawaysResult, winnersResult] = await Promise.all([
        client.from('entries').select('*', { count: 'exact', head: true }),
        client.from('entries').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        client.from('giveaways').select('*', { count: 'exact', head: true }).eq('is_active', true),
        client.from('winners').select('*', { count: 'exact', head: true }),
      ])
      
      setStats({
        totalEntries: entriesResult.count || 0,
        todayEntries: todayEntriesResult.count || 0,
        activeGiveaways: giveawaysResult.count || 0,
        totalWinners: winnersResult.count || 0,
      })
      
      // Fetch stats for all sites
      const allSiteStats: Record<string, SweepsStats> = {}
      
      for (const siteId of SITE_IDS) {
        const siteClient = getSweepsClient(siteId)
        const [entries, todayEntries, giveaways] = await Promise.all([
          siteClient.from('entries').select('*', { count: 'exact', head: true }),
          siteClient.from('entries').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
          siteClient.from('giveaways').select('*', { count: 'exact', head: true }).eq('is_active', true),
        ])
        
        allSiteStats[siteId] = {
          totalEntries: entries.count || 0,
          todayEntries: todayEntries.count || 0,
          activeGiveaways: giveaways.count || 0,
          totalWinners: 0,
        }
      }
      
      setSiteStats(allSiteStats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's your sweepstakes overview
          </p>
        </div>
        <Link href="/dashboard/giveaways/new">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all gap-2">
            <Plus className="h-4 w-4" />
            New Giveaway
          </Button>
        </Link>
      </div>

      {/* Stats Grid - Current Site */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Today's Entries</CardTitle>
            <div className="rounded-lg bg-blue-100 p-2">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayEntries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {SWEEPS_SITES[currentSite].name}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Total Entries</CardTitle>
            <div className="rounded-lg bg-purple-100 p-2">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalEntries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Active Giveaways</CardTitle>
            <div className="rounded-lg bg-green-100 p-2">
              <Gift className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeGiveaways}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Running now
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Winners Drawn</CardTitle>
            <div className="rounded-lg bg-orange-100 p-2">
              <Trophy className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalWinners.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cross-Site Comparison */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>All Sites Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Site</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Today's Entries</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Entries</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Active Giveaways</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {SITE_IDS.map((siteId) => {
                    const site = SWEEPS_SITES[siteId]
                    const stats = siteStats[siteId] || { totalEntries: 0, todayEntries: 0, activeGiveaways: 0, totalWinners: 0 }
                    const colorClass = {
                      purple: 'bg-purple-500',
                      orange: 'bg-orange-500',
                      teal: 'bg-teal-500',
                    }[site.color]
                    
                    return (
                      <tr key={siteId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${colorClass}`} />
                            <span className="font-medium">{site.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-semibold">{stats.todayEntries.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{stats.totalEntries.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{stats.activeGiveaways}</td>
                        <td className="text-right py-3 px-4">
                          <Link href={`/dashboard/giveaways?site=${siteId}`}>
                            <Button variant="ghost" size="sm">
                              Manage
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/dashboard/giveaways" className="group">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all h-full">
            <CardHeader>
              <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-3 w-fit mb-3">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">Manage Giveaways</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create, edit, and manage giveaways across all sites
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/entries" className="group">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all h-full">
            <CardHeader>
              <div className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-3 w-fit mb-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">View Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Browse and export sweepstakes entries
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/winners" className="group">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all h-full">
            <CardHeader>
              <div className="rounded-xl bg-gradient-to-r from-orange-600 to-red-600 p-3 w-fit mb-3">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">Draw Winners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Select random winners and view history
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

