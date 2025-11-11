'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Download, Calendar } from 'lucide-react'
import { useSite } from '@/components/sweeps/SiteContext'
import { getSweepsClient } from '@/lib/supabase-clients'
import type { Entry, Giveaway } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function EntriesPage() {
  const { currentSite } = useSite()
  const [entries, setEntries] = useState<(Entry & { giveaway?: Giveaway })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [filterGiveaway, setFilterGiveaway] = useState<string>('all')
  const [giveaways, setGiveaways] = useState<Giveaway[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const ITEMS_PER_PAGE = 50

  useEffect(() => {
    fetchGiveaways()
  }, [currentSite])

  useEffect(() => {
    fetchEntries()
  }, [currentSite, filterGiveaway, page])

  const fetchGiveaways = async () => {
    try {
      const client = getSweepsClient(currentSite)
      const { data } = await client
        .from('giveaways')
        .select('*')
        .order('created_at', { ascending: false })
      
      setGiveaways(data || [])
    } catch (error) {
      console.error('Error fetching giveaways:', error)
    }
  }

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const client = getSweepsClient(currentSite)
      
      let query = client
        .from('entries')
        .select('*, giveaways(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)
      
      if (filterGiveaway !== 'all') {
        query = query.eq('giveaway_id', filterGiveaway)
      }
      
      const { data, count, error } = await query
      
      if (error) throw error
      
      setEntries(data as any || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEntries = entries.filter(entry => {
    const search = searchEmail.toLowerCase()
    return entry.email.toLowerCase().includes(search)
  })

  const exportToCSV = () => {
    const headers = ['Email', 'Giveaway', 'Confirmation Number', 'Entry Date', 'IP Address']
    const rows = filteredEntries.map(entry => [
      entry.email,
      (entry.giveaway as any)?.title || 'Unknown',
      entry.confirmation_number,
      new Date(entry.created_at).toLocaleString(),
      entry.ip_address || 'N/A',
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `entries-${currentSite}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Entries</h1>
          <p className="text-muted-foreground mt-2">
            {totalCount.toLocaleString()} total entries
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          variant="outline"
          className="gap-2"
          disabled={filteredEntries.length === 0}
        >
          <Download className="h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total Entries</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {new Set(entries.map(e => e.email)).size.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Unique Emails</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{giveaways.length}</div>
            <p className="text-sm text-muted-foreground">Total Giveaways</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="pl-10 h-11 bg-slate-50 border-gray-200"
              />
            </div>

            <div className="w-64">
              <Select value={filterGiveaway} onValueChange={(value) => { setFilterGiveaway(value); setPage(1) }}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Giveaways</SelectItem>
                  {giveaways.map(giveaway => (
                    <SelectItem key={giveaway.id} value={giveaway.id}>
                      {giveaway.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-10 w-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground mt-4">Loading entries...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">No entries found</h3>
            <p className="text-muted-foreground">
              {searchEmail ? 'Try a different search term.' : 'No entries have been submitted yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Giveaway</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Confirmation #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Entry Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium">{entry.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{(entry.giveaway as any)?.title || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-mono">{entry.confirmation_number}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(entry.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-500">{entry.ip_address || 'N/A'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount.toLocaleString()} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="text-sm text-gray-600">
                Page {page} of {Math.ceil(totalCount / ITEMS_PER_PAGE) || 1}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

