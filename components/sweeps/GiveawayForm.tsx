'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Giveaway } from '@/lib/types'

interface GiveawayFormProps {
  giveaway?: Partial<Giveaway>
  onSubmit: (data: Partial<Giveaway>) => Promise<void>
  onCancel: () => void
}

export function GiveawayForm({ giveaway, onSubmit, onCancel }: GiveawayFormProps) {
  const [formData, setFormData] = useState<Partial<Giveaway>>({
    title: giveaway?.title || '',
    prize_name: giveaway?.prize_name || '',
    prize_value: giveaway?.prize_value || null,
    start_date: giveaway?.start_date ? giveaway.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
    end_date: giveaway?.end_date ? giveaway.end_date.split('T')[0] : '',
    max_entries_per_day: giveaway?.max_entries_per_day || 1,
    is_active: giveaway?.is_active ?? true,
    slug: giveaway?.slug || '',
    hero_image: giveaway?.hero_image || '',
    description_1: giveaway?.description_1 || '',
    description_2: giveaway?.description_2 || '',
    sponsor_name: giveaway?.sponsor_name || '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [generatingDesc1, setGeneratingDesc1] = useState(false)
  const [generatingDesc2, setGeneratingDesc2] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateDescription = async (type: 'description_1' | 'description_2') => {
    // Validate that we have basic info needed for generation
    if (!formData.title || !formData.prize_value) {
      alert('Please fill in the Title and Prize Value fields first')
      return
    }

    const setGenerating = type === 'description_1' ? setGeneratingDesc1 : setGeneratingDesc2
    setGenerating(true)
    
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          giveawayData: formData,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate description')
      }
      
      const { description } = await response.json()
      
      setFormData(prev => ({
        ...prev,
        [type]: description,
      }))
    } catch (error) {
      console.error('Error generating description:', error)
      alert('Failed to generate description. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Giveaway Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Win $500 Cash Prize"
              required
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Prize Name *
              </label>
              <Input
                value={formData.prize_name}
                onChange={(e) => handleChange('prize_name', e.target.value)}
                placeholder="$500 Cash"
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Prize Value ($)
              </label>
              <Input
                type="number"
                value={formData.prize_value || ''}
                onChange={(e) => handleChange('prize_value', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="500"
                className="h-11"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Slug (URL-friendly)
            </label>
            <Input
              value={formData.slug || ''}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="500-cash-giveaway"
              className="h-11"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Sponsor Name
            </label>
            <Input
              value={formData.sponsor_name || ''}
              onChange={(e) => handleChange('sponsor_name', e.target.value)}
              placeholder="Your Company Name"
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dates & Settings */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Dates & Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Start Date *
              </label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                End Date *
              </label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                required
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Max Entries Per Day *
              </label>
              <Input
                type="number"
                min="1"
                value={formData.max_entries_per_day}
                onChange={(e) => handleChange('max_entries_per_day', parseInt(e.target.value))}
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Status
              </label>
              <div className="flex items-center gap-2 h-11">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Hero Image URL
            </label>
            <Input
              type="url"
              value={formData.hero_image || ''}
              onChange={(e) => handleChange('hero_image', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Descriptions */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Descriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                Description 1
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => generateDescription('description_1')}
                disabled={generatingDesc1}
                className="h-8 text-xs gap-1"
              >
                {generatingDesc1 ? (
                  <>Generating...</>
                ) : (
                  <>
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
            <textarea
              value={formData.description_1 || ''}
              onChange={(e) => handleChange('description_1', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Main description for the giveaway..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                Description 2
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => generateDescription('description_2')}
                disabled={generatingDesc2}
                className="h-8 text-xs gap-1"
              >
                {generatingDesc2 ? (
                  <>Generating...</>
                ) : (
                  <>
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
            <textarea
              value={formData.description_2 || ''}
              onChange={(e) => handleChange('description_2', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional description..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={submitting}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          {submitting ? 'Saving...' : giveaway?.id ? 'Update Giveaway' : 'Create Giveaway'}
        </Button>
      </div>
    </form>
  )
}

