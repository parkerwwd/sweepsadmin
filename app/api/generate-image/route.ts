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
    
    // For now, use Picsum (Lorem Picsum) for reliable placeholder images
    // This always works and doesn't have CORS issues
    // You can replace this with actual AI generation (DALL-E, Stable Diffusion, etc.)
    
    // Generate a random seed based on giveaway data for consistency
    const seed = Math.abs(
      (giveawayData.title?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0) +
      Number(giveawayData.prize_value || 0)
    )
    
    // Use Picsum with seed for consistent random images
    const imageUrl = `https://picsum.photos/seed/${seed}/1200/630`
    
    return NextResponse.json({ 
      imageUrl,
      prompt, // Return the prompt so you can use it with actual AI later
      message: 'Using Picsum placeholder. You can integrate with DALL-E API for custom AI-generated images by adding OPENAI_API_KEY to environment variables.'
    })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}

