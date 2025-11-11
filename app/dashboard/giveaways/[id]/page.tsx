'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { GiveawayForm } from '@/components/sweeps/GiveawayForm'
import { useSite } from '@/components/sweeps/SiteContext'
import { getSweepsClient } from '@/lib/supabase-clients'
import type { Giveaway } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'

export default function EditGiveawayPage() {
  const router = useRouter()
  const params = useParams()
  const { currentSite } = useSite()
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null)
  const [loading, setLoading] = useState(true)
  const [entryCount, setEntryCount] = useState(0)

  useEffect(() => {
    fetchGiveaway()
  }, [params.id, currentSite])

  const fetchGiveaway = async () => {
    setLoading(true)
    try {
      const client = getSweepsClient(currentSite)
      
      const { data, error } = await client
        .from('giveaways')
        .select('*')
        .eq('id', params.id)
        .single()
      
      if (error) throw error
      
      setGiveaway(data)
      
      // Fetch entry count
      const { count } = await client
        .from('entries')
        .select('*', { count: 'exact', head: true })
        .eq('giveaway_id', params.id)
      
      setEntryCount(count || 0)
    } catch (error) {
      console.error('Error fetching giveaway:', error)
      alert('Failed to load giveaway')
      router.push('/dashboard/giveaways')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: Partial<Giveaway>) => {
    try {
      const client = getSweepsClient(currentSite)
      
      const { error } = await client
        .from('giveaways')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
      
      if (error) throw error
      
      alert('Giveaway updated successfully!')
      router.push('/dashboard/giveaways')
    } catch (error: any) {
      console.error('Error updating giveaway:', error)
      alert(`Failed to update giveaway: ${error.message}`)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/giveaways')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="inline-block h-10 w-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!giveaway) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="text-center py-16">
          <h3 className="text-xl font-semibold mb-2">Giveaway not found</h3>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Edit Giveaway</h1>
          <p className="text-muted-foreground mt-2">
            {entryCount.toLocaleString()} entries submitted
          </p>
        </div>
      </div>

      <GiveawayForm giveaway={giveaway} onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  )
}

