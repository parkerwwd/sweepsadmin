import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type SiteId = 'anytrivia' | 'ccs' | 'mgs' | 'triviabright'

export interface SweepsSite {
  id: SiteId
  name: string
  url: string
  color: string
  supabaseUrl: string
  supabaseAnonKey: string
}

export const SWEEPS_SITES: Record<SiteId, SweepsSite> = {
  anytrivia: {
    id: 'anytrivia',
    name: 'AnyTrivia Sweeps',
    url: 'https://sweeps.anytrivia.com',
    color: 'purple',
    supabaseUrl: process.env.NEXT_PUBLIC_ANYTRIVIA_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_ANYTRIVIA_SUPABASE_ANON_KEY || '',
  },
  ccs: {
    id: 'ccs', 
    name: 'Cooking Curiosity Sweeps',
    url: 'https://sweeps.cookingcuriosity.com',
    color: 'orange',
    supabaseUrl: process.env.NEXT_PUBLIC_CCS_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_CCS_SUPABASE_ANON_KEY || '',
  },
  mgs: {
    id: 'mgs',
    name: 'MarketGrow Sweeps', 
    url: 'https://sweeps.marketgrow.com',
    color: 'teal',
    supabaseUrl: process.env.NEXT_PUBLIC_MGS_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_MGS_SUPABASE_ANON_KEY || '',
  },
  triviabright: {
    id: 'triviabright',
    name: 'TriviaBright Sweeps',
    url: 'https://yourdomain.com',
    color: 'sky',
    supabaseUrl: process.env.NEXT_PUBLIC_TRIVIABRIGHT_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_TRIVIABRIGHT_SUPABASE_ANON_KEY || '',
  }
}

// Cache clients to avoid creating new instances
const clientCache: Partial<Record<SiteId, SupabaseClient>> = {}
let adminClient: SupabaseClient | null = null
let adminDummyClient: SupabaseClient | null = null

export function getSweepsClient(siteId: SiteId): SupabaseClient {
  if (clientCache[siteId]) {
    return clientCache[siteId]!
  }
  
  const site = SWEEPS_SITES[siteId]
  
  // During build time, return a dummy client if credentials missing
  if (!site.supabaseUrl || !site.supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // Build time - return dummy client
      return createClient('https://placeholder.supabase.co', 'placeholder-key')
    }
    throw new Error(`Missing Supabase credentials for site: ${siteId}`)
  }
  
  const client = createClient(site.supabaseUrl, site.supabaseAnonKey)
  clientCache[siteId] = client
  
  return client
}

export const SITE_IDS: SiteId[] = ['anytrivia', 'ccs', 'mgs', 'triviabright']

// Admin auth uses AnyTrivia Supabase
export function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_ADMIN_SUPABASE_URL || process.env.NEXT_PUBLIC_ANYTRIVIA_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_ADMIN_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_ANYTRIVIA_SUPABASE_ANON_KEY || ''
  
  // During build time, return a dummy client if credentials missing
  if (!url || !key) {
    if (typeof window === 'undefined') {
      if (!adminDummyClient) {
        // Build time - return dummy client
        adminDummyClient = createClient('https://placeholder.supabase.co', 'placeholder-key')
      }
      return adminDummyClient
    }
    throw new Error('Missing admin Supabase credentials')
  }
  
  if (!adminClient) {
    adminClient = createClient(url, key)
  }

  return adminClient
}

