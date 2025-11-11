'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { getSweepsClient, SWEEPS_SITES, SITE_IDS } from '@/lib/supabase-clients'

interface SiteAnalytics {
  siteName: string
  color: string
  totalEntries: number
  activeGiveaways: number
  completedGiveaways: number
  winnersDrawn: number
  avgEntriesPerGiveaway: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<SiteAnalytics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const results: SiteAnalytics[] = []
      
      for (const siteId of SITE_IDS) {
        const client = getSweepsClient(siteId)
        const site = SWEEPS_SITES[siteId]
        
        const [entriesResult, activeGiveawaysResult, completedGiveawaysResult, winnersResult, allGiveawaysResult] = await Promise.all([
          client.from('entries').select('*', { count: 'exact', head: true }),
          client.from('giveaways').select('*', { count: 'exact', head: true }).eq('is_active', true),
          client.from('giveaways').select('*', { count: 'exact', head: true }).eq('is_active', false),
          client.from('winners').select('*', { count: 'exact', head: true }),
          client.from('giveaways').select('*', { count: 'exact', head: true }),
        ])
        
        const totalEntries = entriesResult.count || 0
        const totalGiveaways = allGiveawaysResult.count || 1
        
        results.push({
          siteName: site.name,
          color: site.color,
          totalEntries,
          activeGiveaways: activeGiveawaysResult.count || 0,
          completedGiveaways: completedGiveawaysResult.count || 0,
          winnersDrawn: winnersResult.count || 0,
          avgEntriesPerGiveaway: Math.round(totalEntries / totalGiveaways),
        })
      }
      
      setAnalytics(results)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      teal: 'bg-teal-500',
    }
    return colors[color] || 'bg-gray-500'
  }

  const totalAcrossAll = analytics.reduce((acc, site) => ({
    entries: acc.entries + site.totalEntries,
    giveaways: acc.giveaways + site.activeGiveaways,
    winners: acc.winners + site.winnersDrawn,
  }), { entries: 0, giveaways: 0, winners: 0 })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Cross-site performance comparison
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Total Entries</CardTitle>
            <div className="rounded-lg bg-blue-100 p-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAcrossAll.entries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all sites</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Active Giveaways</CardTitle>
            <div className="rounded-lg bg-green-100 p-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAcrossAll.giveaways}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently running</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Winners Drawn</CardTitle>
            <div className="rounded-lg bg-orange-100 p-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAcrossAll.winners.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Site Comparison Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Site-by-Site Comparison</CardTitle>
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
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Entries</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Active Giveaways</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Completed</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Winners</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Entries/Giveaway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.map((site) => (
                    <tr key={site.siteName} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${getColorClass(site.color)}`} />
                          <span className="font-medium">{site.siteName}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-semibold">{site.totalEntries.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">{site.activeGiveaways}</td>
                      <td className="text-right py-3 px-4">{site.completedGiveaways}</td>
                      <td className="text-right py-3 px-4">{site.winnersDrawn}</td>
                      <td className="text-right py-3 px-4">{site.avgEntriesPerGiveaway.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

