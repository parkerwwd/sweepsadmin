import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

interface RequestBody {
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const siteId = formData.get('siteId') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!siteId || !['anytrivia', 'ccs', 'mgs'].includes(siteId)) {
      return NextResponse.json(
        { error: 'Invalid site ID' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `giveaway-${timestamp}-${randomStr}.${extension}`

    // Upload to Supabase Storage
    const supabase = getSiteSupabaseClient(siteId)
    const { error: uploadError } = await supabase.storage
      .from('giveaway-images')
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('giveaway-images')
      .getPublicUrl(filename)

    console.log('Image uploaded successfully:', publicUrl)

    return NextResponse.json({
      imageUrl: publicUrl,
      message: 'Image uploaded successfully',
      filename
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

