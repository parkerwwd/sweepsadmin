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

function generateImagePrompt(data: GiveawayData): string {
  const parsedValue = parsePrizeValue(data.prize_value)
  const prizeValue = parsedValue ? `$${parsedValue.toLocaleString()}` : ''
  const prizeName = data.prize_name || data.title || 'cash prize'
  
  // Toned down, subtle prompts for professional look
  const prompts = [
    `Clean, professional website hero banner for ${prizeValue} ${prizeName} sweepstakes. Minimal style, soft pastel colors, simple and elegant. Subtle money or prize symbols in background. NO TEXT. Modern, understated, trustworthy design. Wide format.`,
    `Simple professional banner image for ${prizeValue} ${prizeName} giveaway. Clean minimal design, soft colors, elegant and inviting. Subtle celebration theme without being dramatic. NO TEXT OVERLAY. Professional website header style.`,
    `Elegant hero image for ${prizeValue} ${prizeName} contest. Minimalist professional style, soft warm colors, clean composition. Gentle prize theme, subtle and refined. NO WORDS. Modern website banner aesthetic.`,
    `Professional website banner for ${prizeValue} ${prizeName}. Clean minimal design with soft color palette. Subtle money or gift elements, elegant and trustworthy look. NO TEXT in image. Simple, professional, inviting.`
  ]
  
  return prompts[Math.floor(Math.random() * prompts.length)]
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
    
    // Use OpenAI gpt-image-1 if API key is available
    if (openaiKey) {
      try {
        console.log('Using OpenAI gpt-image-1 to generate image...')
        console.log('Prompt:', prompt)

        const openai = new OpenAI({ apiKey: openaiKey })
        const openaiData = await openai.images.generate({
          model: 'gpt-image-1',
          prompt,
          size: '1024x1024',
          response_format: 'b64_json',
        })

        const imageBase64 = openaiData.data?.[0]?.b64_json
        if (!imageBase64) {
          throw new Error('No image data returned from OpenAI')
        }

        const imageBuffer = Buffer.from(imageBase64, 'base64')
        
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
            imageUrl: `data:image/png;base64,${imageBase64}`,
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
      message: 'Using Picsum placeholder. Add OPENAI_API_KEY environment variable to enable gpt-image-1 image generation.',
      provider: 'picsum'
    })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}

