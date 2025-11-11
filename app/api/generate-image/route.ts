import { NextRequest, NextResponse } from 'next/server'

interface GiveawayData {
  title?: string
  prize_name?: string
  prize_value?: number | string
  [key: string]: any
}

function generateImagePrompt(data: GiveawayData): string {
  const prizeValue = data.prize_value ? `$${Number(data.prize_value).toLocaleString()}` : ''
  const prizeName = data.prize_name || data.title || 'cash prize'
  
  // Create a compelling image prompt
  const prompts = [
    `Professional sweepstakes promotional image featuring ${prizeValue} ${prizeName}. Modern, clean design with exciting colors. High quality, eye-catching, professional marketing style. Include symbolic representations of money, prizes, or celebration. Vibrant and appealing.`,
    `Eye-catching giveaway hero image for ${prizeValue} ${prizeName}. Professional marketing quality, bright and inviting colors, symbols of winning and success. Clean modern design, no text overlay needed. High-resolution promotional photography style.`,
    `Stunning promotional banner for ${prizeValue} ${prizeName} sweepstakes. Professional quality with exciting visual elements suggesting prizes, rewards, and winning. Modern advertising style, vibrant colors, clean composition. Marketing-grade quality.`,
    `Premium sweepstakes header image featuring ${prizeValue} ${prizeName} concept. Professional advertising photography with symbols of prizes, cash, and celebration. Bright, exciting, modern design. High-quality marketing material style.`
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
    
    // Generate image using a placeholder service for now
    // In production, you'd integrate with DALL-E, Midjourney, or similar
    const prompt = generateImagePrompt(giveawayData)
    
    // For now, return a Unsplash placeholder image with relevant keywords
    // You can replace this with actual AI generation (DALL-E, Stable Diffusion, etc.)
    const keywords = giveawayData.prize_name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'money-cash-prize'
    
    // Use Unsplash's random image API with relevant keywords
    const imageUrl = `https://source.unsplash.com/1200x630/?${keywords},sweepstakes,winner,prize`
    
    return NextResponse.json({ 
      imageUrl,
      prompt, // Return the prompt so you can use it with actual AI later
      message: 'Using Unsplash placeholder. Integrate with DALL-E or similar for custom AI images.'
    })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}

