'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useSite } from '@/components/sweeps/SiteContext'
import { getSweepsClient } from '@/lib/supabase-clients'
import type { Giveaway } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function GiveawaysPage() {
  const { currentSite } = useSite()
  const [giveaways, setGiveaways] = useState<Giveaway[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchGiveaways()
  }, [currentSite, filterStatus])

  const fetchGiveaways = async () => {
    setLoading(true)
    try {
      const client = getSweepsClient(currentSite)
      
      let query = client
        .from('giveaways')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (filterStatus === 'active') {
        query = query.eq('is_active', true)
      } else if (filterStatus === 'ended') {
        query = query.eq('is_active', false)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setGiveaways(data || [])
      
      // Fetch entry counts for each giveaway
      if (data) {
        const counts: Record<string, number> = {}
        await Promise.all(
          data.map(async (giveaway) => {
            const { count } = await client
              .from('entries')
              .select('*', { count: 'exact', head: true })
              .eq('giveaway_id', giveaway.id)
            counts[giveaway.id] = count || 0
          })
        )
        setEntryCounts(counts)
      }
    } catch (error) {
      console.error('Error fetching giveaways:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this giveaway? This will also delete all associated entries.')) return

    try {
      const client = getSweepsClient(currentSite)
      const { error } = await client
        .from('giveaways')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchGiveaways()
    } catch (error) {
      console.error('Error deleting giveaway:', error)
      alert('Failed to delete giveaway')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatPrizeValue = (value: number | null) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Giveaways</h1>
          <p className="text-muted-foreground mt-2">
            Manage {giveaways.length} giveaway{giveaways.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/giveaways/new">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all gap-2">
            <Plus className="h-4 w-4" />
            New Giveaway
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-48">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Giveaways</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="ended">Ended Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Giveaways Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-10 w-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground mt-4">Loading giveaways...</p>
        </div>
      ) : giveaways.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">No giveaways found</h3>
            <p className="text-muted-foreground mb-6">
              Create your first giveaway to get started!
            </p>
            <Link href="/dashboard/giveaways/new">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white gap-2">
                <Plus className="h-4 w-4" />
                Create Giveaway
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Giveaway</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Prize Value</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">End Date</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Entries</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {giveaways.map((giveaway) => (
                  <tr key={giveaway.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <Link 
                          href={`/dashboard/giveaways/${giveaway.id}`}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {giveaway.title}
                        </Link>
                        <p className="text-sm text-gray-500">{giveaway.prize_name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{formatPrizeValue(giveaway.prize_value)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={giveaway.is_active ? 'default' : 'secondary'} className={giveaway.is_active ? 'bg-green-100 text-green-700' : ''}>
                        {giveaway.is_active ? 'Active' : 'Ended'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(giveaway.end_date)}
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="font-semibold">{entryCounts[giveaway.id]?.toLocaleString() || 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/giveaways/${giveaway.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(giveaway.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

