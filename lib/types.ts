export interface Giveaway {
  id: string
  title: string
  prize_name: string
  prize_value: number | null
  start_date: string
  end_date: string
  max_entries_per_day: number
  is_active: boolean
  slug: string | null
  hero_image: string | null
  description_1: string | null
  description_2: string | null
  sponsor_name: string | null
  created_at: string
  updated_at: string
}

export interface Entry {
  id: string
  giveaway_id: string
  email: string
  created_at: string
  confirmation_number: string
  ip_address: string | null
  user_agent: string | null
}

export interface Winner {
  id: string
  giveaway_id: string
  entry_id: string
  email: string
  drawn_at: string
  notified_at: string | null
  claimed_at: string | null
  giveaway?: Giveaway
}

export interface SweepsStats {
  totalEntries: number
  todayEntries: number
  activeGiveaways: number
  totalWinners: number
}

