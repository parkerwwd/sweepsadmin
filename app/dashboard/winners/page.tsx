'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Calendar, Sparkles } from 'lucide-react'
import { useSite } from '@/components/sweeps/SiteContext'
import { getSweepsClient } from '@/lib/supabase-clients'
import type { Winner, Giveaway } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function WinnersPage() {
  const { currentSite } = useSite()
  const [winners, setWinners] = useState<Winner[]>([])
  const [giveaways, setGiveaways] = useState<Giveaway[]>([])
  const [selectedGiveaway, setSelectedGiveaway] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [drawnWinner, setDrawnWinner] = useState<Winner | null>(null)

  useEffect(() => {
    fetchGiveaways()
    fetchWinners()
  }, [currentSite])

  const fetchGiveaways = async () => {
    try {
      const client = getSweepsClient(currentSite)
      const { data } = await client
        .from('giveaways')
        .select('*')
        .eq('is_active', true)
        .order('end_date', { ascending: true })
      
      setGiveaways(data || [])
    } catch (error) {
      console.error('Error fetching giveaways:', error)
    }
  }

  const fetchWinners = async () => {
    setLoading(true)
    try {
      const client = getSweepsClient(currentSite)
      const { data, error } = await client
        .from('winners')
        .select('*, giveaways(*)')
        .order('drawn_at', { ascending: false })
      
      if (error) throw error
      
      setWinners(data as any || [])
    } catch (error) {
      console.error('Error fetching winners:', error)
    } finally {
      setLoading(false)
    }
  }

  const drawWinner = async () => {
    if (!selectedGiveaway) {
      alert('Please select a giveaway first')
      return
    }

    setDrawing(true)
    setDrawnWinner(null)

    try {
      const client = getSweepsClient(currentSite)
      
      // Get all entries for this giveaway that haven't won
      const { data: entries, error: entriesError } = await client
        .from('entries')
        .select('*')
        .eq('giveaway_id', selectedGiveaway)
      
      if (entriesError) throw entriesError
      
      if (!entries || entries.length === 0) {
        alert('No entries found for this giveaway')
        return
      }
      
      // Check which emails have already won
      const { data: existingWinners } = await client
        .from('winners')
        .select('email')
        .eq('giveaway_id', selectedGiveaway)
      
      const winnerEmails = new Set(existingWinners?.map(w => w.email) || [])
      
      // Filter out entries that have already won
      const eligibleEntries = entries.filter(e => !winnerEmails.has(e.email))
      
      if (eligibleEntries.length === 0) {
        alert('No eligible entries (all participants have already won)')
        return
      }
      
      // Randomly select winner
      const randomIndex = Math.floor(Math.random() * eligibleEntries.length)
      const winningEntry = eligibleEntries[randomIndex]
      
      // Insert winner
      const { data: newWinner, error: insertError } = await client
        .from('winners')
        .insert({
          giveaway_id: selectedGiveaway,
          entry_id: winningEntry.id,
          email: winningEntry.email,
          drawn_at: new Date().toISOString(),
        })
        .select('*, giveaways(*)')
        .single()
      
      if (insertError) throw insertError
      
      setDrawnWinner(newWinner as any)
      fetchWinners()
      alert(`Winner selected: ${winningEntry.email}`)
    } catch (error: any) {
      console.error('Error drawing winner:', error)
      alert(`Failed to draw winner: ${error.message}`)
    } finally {
      setDrawing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Winners</h1>
        <p className="text-muted-foreground mt-2">
          Draw winners and view history
        </p>
      </div>

      {/* Draw Winner Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-3 w-fit shadow-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Draw Random Winner</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Select a giveaway and randomly choose a winner
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Select Giveaway
            </label>
            <Select value={selectedGiveaway} onValueChange={setSelectedGiveaway}>
              <SelectTrigger className="h-11 bg-white">
                <SelectValue placeholder="Choose a giveaway..." />
              </SelectTrigger>
              <SelectContent>
                {giveaways.map(giveaway => (
                  <SelectItem key={giveaway.id} value={giveaway.id}>
                    {giveaway.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={drawWinner}
            disabled={!selectedGiveaway || drawing}
            className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg transition-all gap-2"
          >
            <Sparkles className="h-5 w-5" />
            {drawing ? 'Drawing Winner...' : 'Draw Random Winner'}
          </Button>

          {drawnWinner && (
            <div className="bg-white border-2 border-green-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-600 mb-1">Winner Drawn!</p>
              <p className="text-lg font-bold text-green-700">{drawnWinner.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Giveaway: {(drawnWinner.giveaway as any)?.title}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Winner History */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Winner History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : winners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No winners have been drawn yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Giveaway</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Drawn Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {winners.map((winner) => (
                    <tr key={winner.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium">{winner.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{(winner.giveaway as any)?.title || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(winner.drawn_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {winner.claimed_at ? '✅ Claimed' : winner.notified_at ? '📧 Notified' : '⏳ Pending'}
                        </span>
                      </td>
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

