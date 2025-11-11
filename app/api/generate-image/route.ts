import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { Buffer } from 'node:buffer'

export const runtime = 'nodejs'

interface GiveawayData {
  title?: string
  prize_name?: string
  prize_value?: number | string
  [key: string]: any
}

interface RequestBody {
  giveawayData: GiveawayData
  siteId: 'anytrivia' | 'ccs' | 'mgs'
}

// Get Supabase client for the specified site
function getSiteSupabaseClient(siteId: string) {
  const configs: Record<string, { url: string, key: string }> = {
    anytrivia: {
      url: process.env.NEXT_PUBLIC_ANYTRIVIA_SUPABASE_URL || '',
      key: process.env.NEXT_PUBLIC_ANYTRIVIA_SUPABASE_ANON_KEY || '',
    },
    ccs: {
      url: process.env.NEXT_PUBLIC_CCS_SUPABASE_URL || '',
      key: process.env.NEXT_PUBLIC_CCS_SUPABASE_ANON_KEY || '',
    },
    mgs: {
      url: process.env.NEXT_PUBLIC_MGS_SUPABASE_URL || '',
      key: process.env.NEXT_PUBLIC_MGS_SUPABASE_ANON_KEY || '',
    },
  }
  
  const config = configs[siteId]
  if (!config || !config.url || !config.key) {
    throw new Error(`Invalid Supabase config for site: ${siteId}`)
  }
  
  return createClient(config.url, config.key)
}

function parsePrizeValue(prizeValue?: number | string) {
  if (prizeValue === undefined || prizeValue === null) {
    return null
  }

  if (typeof prizeValue === 'number') {
    return Number.isFinite(prizeValue) ? prizeValue : null
  }

  const numeric = Number.parseFloat(prizeValue.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}

function derivePrizeHints(prizeName: string) {
  const normalized = prizeName.toLowerCase()

  if (normalized.includes('cash') || normalized.includes('money') || normalized.includes('usd') || normalized.includes('$')) {
    return 'Incorporate subtle, tasteful cues of winning cash: crisp dollar bills, soft golden light, sophisticated financial accents.'
  }

  if (normalized.includes('gift') && normalized.includes('card')) {
    return 'Include premium gift card elements: elegant cards with abstract branding, refined ribbon details, upscale retail ambiance.'
  }

  if (normalized.includes('trip') || normalized.includes('travel') || normalized.includes('vacation')) {
    return 'Capture premium travel energy: dreamy destination lighting, luggage or airplane hints, luxurious getaway atmosphere.'
  }

  if (normalized.includes('car') || normalized.includes('vehicle')) {
    return 'Suggest an automotive grand prize: sleek car silhouette, dramatic showroom lighting, modern metallic reflections.'
  }

  return 'Use modern celebratory cues that feel premium and trustworthy: confetti bokeh, elegant lighting, sophisticated prize symbolism.'
}

function generateImagePrompt(data: GiveawayData): string {
  const parsedValue = parsePrizeValue(data.prize_value)
  const prizeValue = parsedValue ? `$${parsedValue.toLocaleString()}` : ''
  const prizeName = data.prize_name || data.title || 'premium prize'
  const sponsor = data.sponsor_name ? `Primary brand tone: ${data.sponsor_name}.` : ''
  const prizeHints = derivePrizeHints(prizeName)

  return [
    `Create a high-end, photorealistic hero image for a sweepstakes landing page.`,
    `Prize: ${prizeValue ? `${prizeValue} ` : ''}${prizeName}.`,
    sponsor,
    prizeHints,
    `Visual direction: modern commercial photography, cinematic lighting, shallow depth of field, vibrant yet refined color palette.`,
    `Composition: wide hero banner framing with clear focal point, allow safe cropping to 16:9.`,
    `Keep the scene realistic, inspiring, and professional—avoid clutter, cartoon styles, or cheesy clip art.`,
    `Absolutely no text, lettering, logos, or watermarks in the image.`
  ].filter(Boolean).join(' ')
}

export async function POST(request: NextRequest) {
  try {
    const { giveawayData, siteId } = await request.json() as RequestBody
    
    if (!giveawayData || !siteId) {
      return NextResponse.json(
        { error: 'Missing giveaway data or site ID' },
        { status: 400 }
      )
    }
    
    const prompt = generateImagePrompt(giveawayData)
    const openaiKey = process.env.OPENAI_API_KEY?.trim()
    const hasOpenAiKey = Boolean(openaiKey)
    let openAiErrorMessage: string | null = null
    
    // Use OpenAI gpt-image-1 if API key is available
    if (hasOpenAiKey && openaiKey) {
      try {
        console.log('Using OpenAI gpt-image-1 to generate image...')
        console.log('Prompt:', prompt)

        const openai = new OpenAI({ apiKey: openaiKey })
        const openaiData = await openai.images.generate({
          model: 'gpt-image-1',
          prompt,
          size: '1024x1024',
          quality: 'high',
          background: 'transparent'
        })

        const imageB64 = openaiData.data?.[0]?.b64_json
        const imageUrlFromOpenAi = openaiData.data?.[0]?.url

        if (!imageB64) {
          if (imageUrlFromOpenAi) {
            console.log('OpenAI returned hosted image URL, downloading...')
            const imageResponse = await fetch(imageUrlFromOpenAi)
            if (!imageResponse.ok) {
              throw new Error(`Failed to download OpenAI image: ${imageResponse.status} ${imageResponse.statusText}`)
            }

            const arrayBuffer = await imageResponse.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            const timestamp = Date.now()
            const filename = `giveaway-${timestamp}-${Math.random().toString(36).substring(7)}.png`

            const supabase = getSiteSupabaseClient(siteId)
            const { error: uploadError } = await supabase.storage
              .from('giveaway-images')
              .upload(filename, buffer, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              console.error('Supabase upload error (URL flow):', uploadError)
              return NextResponse.json({
                imageUrl: imageUrlFromOpenAi,
                prompt,
                message: 'Generated with gpt-image-1 (temporary URL - Supabase upload failed)',
                provider: 'openai-temp-url'
              })
            }

            const { data: { publicUrl } } = supabase.storage
              .from('giveaway-images')
              .getPublicUrl(filename)

            console.log('Image saved to Supabase successfully (URL flow):', publicUrl)

            return NextResponse.json({
              imageUrl: publicUrl,
              prompt,
              message: 'Generated with gpt-image-1 and saved to Supabase Storage',
              provider: 'openai-saved'
            })
          }

          throw new Error('No image data returned from OpenAI')
        }

        const imageBuffer = Buffer.from(imageB64, 'base64')
        
        // Generate unique filename
        const timestamp = Date.now()
        const filename = `giveaway-${timestamp}-${Math.random().toString(36).substring(7)}.png`
        
        // Upload to Supabase Storage
        const supabase = getSiteSupabaseClient(siteId)
        const { error: uploadError } = await supabase.storage
          .from('giveaway-images')
          .upload(filename, imageBuffer, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError) {
          console.error('Supabase upload error:', uploadError)
          // Return temporary URL if upload fails
          return NextResponse.json({
            imageUrl: `data:image/png;base64,${imageB64}`,
            prompt,
            message: 'Generated with gpt-image-1 (base64 URL - Supabase upload failed)',
            provider: 'openai-temp'
          })
        }
        
        // Get public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('giveaway-images')
          .getPublicUrl(filename)
        
        console.log('Image saved to Supabase successfully:', publicUrl)
        
        return NextResponse.json({ 
          imageUrl: publicUrl,
          prompt,
          message: 'Generated with gpt-image-1 and saved to Supabase Storage',
          provider: 'openai-saved'
        })
      } catch (openaiError: any) {
        openAiErrorMessage = openaiError?.message || openaiError?.toString?.() || 'Unknown OpenAI error'
        console.error('OpenAI generation failed:', openaiError)
        // Fall back to Picsum if OpenAI fails
      }
    }
    
    // Fallback: Use Picsum placeholder if no OpenAI key or if OpenAI fails
    console.log('Using Picsum placeholder image')
    
    const seedBaseValue = parsePrizeValue(giveawayData.prize_value) ?? 0
    const seed = Math.abs(
      (giveawayData.title?.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) || 0) +
      seedBaseValue
    )
    
    const imageUrl = `https://picsum.photos/seed/${seed}/1200/630`
    
    return NextResponse.json({ 
      imageUrl,
      prompt,
      message: hasOpenAiKey
        ? `Using Picsum placeholder because gpt-image-1 failed: ${openAiErrorMessage ?? 'Unknown error'}`
        : 'Using Picsum placeholder. Add OPENAI_API_KEY environment variable to enable gpt-image-1 image generation.',
      provider: hasOpenAiKey ? 'openai-error' : 'picsum'
    })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}

