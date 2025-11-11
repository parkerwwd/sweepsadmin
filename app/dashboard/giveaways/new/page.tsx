'use client'

export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import { GiveawayForm } from '@/components/sweeps/GiveawayForm'
import { useSite } from '@/components/sweeps/SiteContext'
import { getSweepsClient } from '@/lib/supabase-clients'
import type { Giveaway } from '@/lib/types'

export default function NewGiveawayPage() {
  const router = useRouter()
  const { currentSite } = useSite()

  const handleSubmit = async (data: Partial<Giveaway>) => {
    try {
      const client = getSweepsClient(currentSite)
      
      const { error } = await client
        .from('giveaways')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      
      if (error) throw error
      
      alert('Giveaway created successfully!')
      router.push('/dashboard/giveaways')
    } catch (error: any) {
      console.error('Error creating giveaway:', error)
      alert(`Failed to create giveaway: ${error.message}`)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/giveaways')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Create Giveaway</h1>
        <p className="text-muted-foreground mt-2">
          Add a new giveaway to your site
        </p>
      </div>

      <GiveawayForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  )
}

