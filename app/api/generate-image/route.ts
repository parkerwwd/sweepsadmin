import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface GiveawayData {
  title?: string
  prize_name?: string
  prize_value?: number | string
  [key: string]: any
}

function generateImagePrompt(data: GiveawayData): string {
  const prizeValue = data.prize_value ? `$${Number(data.prize_value).toLocaleString()}` : ''
  const prizeName = data.prize_name || data.title || 'cash prize'
  
  // Optimized prompt for DALL-E 3
  const prompts = [
    `Professional sweepstakes hero banner image, wide format. Theme: ${prizeValue} ${prizeName} giveaway. Style: modern marketing, bright exciting colors, symbols of winning and prizes. NO TEXT in image. High quality promotional banner style. Vibrant, eye-catching, professional.`,
    `Wide marketing banner for ${prizeValue} ${prizeName} sweepstakes. Professional advertising photography with cash, prizes, celebration theme. Exciting colors, modern clean design. NO TEXT OVERLAY. High-end promotional image quality.`,
    `Hero image for ${prizeValue} ${prizeName} contest. Professional banner style, wide format. Bright inviting colors with symbols of winning, money, rewards. Clean modern composition. NO WORDS OR TEXT. Marketing photography quality.`
  ]
  
  return prompts[Math.floor(Math.random() * prompts.length)]
}

export async function POST(request: NextRequest) {
  try {
    const { giveawayData } = await request.json()
    
    if (!giveawayData) {
      return NextResponse.json(
        { error: 'Missing giveaway data' },
        { status: 400 }
      )
    }
    
    const prompt = generateImagePrompt(giveawayData)
    const openaiKey = process.env.OPENAI_API_KEY
    
    // Use OpenAI DALL-E if API key is available
    if (openaiKey) {
      try {
        console.log('Using OpenAI DALL-E 3 to generate image...')
        console.log('Prompt:', prompt)
        
        const openai = new OpenAI({ apiKey: openaiKey })
        
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1792x1024', // Wide format for hero images
          quality: 'standard', // Use 'hd' for higher quality but costs more
        })
        
        const imageUrl = response.data?.[0]?.url
        
        if (!imageUrl) {
          throw new Error('No image URL returned from OpenAI')
        }
        
        console.log('OpenAI image generated successfully')
        
        return NextResponse.json({ 
          imageUrl,
          prompt,
          message: 'Generated with DALL-E 3',
          provider: 'openai'
        })
      } catch (openaiError: any) {
        console.error('OpenAI generation failed:', openaiError.message)
        // Fall back to Picsum if OpenAI fails
      }
    }
    
    // Fallback: Use Picsum placeholder if no OpenAI key or if OpenAI fails
    console.log('Using Picsum placeholder image')
    
    const seed = Math.abs(
      (giveawayData.title?.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) || 0) +
      Number(giveawayData.prize_value || 0)
    )
    
    const imageUrl = `https://picsum.photos/seed/${seed}/1200/630`
    
    return NextResponse.json({ 
      imageUrl,
      prompt,
      message: 'Using Picsum placeholder. Add OPENAI_API_KEY environment variable to use DALL-E 3 for custom AI images.',
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

