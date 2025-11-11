# Sweeps Admin - Multi-Site Management Panel

Centralized admin dashboard for managing giveaways, entries, and winners across multiple sweepstakes sites.

## Features

- Manage multiple sweepstakes sites from one dashboard
- Create and edit giveaways
- View and export entries
- Draw random winners
- Cross-site analytics

## Sites Managed

- AnyTrivia Sweeps
- Cooking Curiosity Sweeps
- MarketGrow Sweeps

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env.local` with the following variables:

```bash
# AnyTrivia Sweeps
NEXT_PUBLIC_ANYTRIVIA_SUPABASE_URL=your_anytrivia_url
NEXT_PUBLIC_ANYTRIVIA_SUPABASE_ANON_KEY=your_anytrivia_key

# Cooking Curiosity Sweeps  
NEXT_PUBLIC_CCS_SUPABASE_URL=your_ccs_url
NEXT_PUBLIC_CCS_SUPABASE_ANON_KEY=your_ccs_key

# MarketGrow Sweeps
NEXT_PUBLIC_MGS_SUPABASE_URL=your_mgs_url
NEXT_PUBLIC_MGS_SUPABASE_ANON_KEY=your_mgs_key

# Admin Auth (typically use AnyTrivia Supabase)
NEXT_PUBLIC_ADMIN_SUPABASE_URL=your_admin_url
NEXT_PUBLIC_ADMIN_SUPABASE_ANON_KEY=your_admin_key

# Admin Email Whitelist (comma-separated)
NEXT_PUBLIC_ADMIN_EMAILS=parker@worldwidedigital.com
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

```bash
vercel
```

## Usage

1. Log in with your admin email
2. Select a site from the dropdown
3. Manage giveaways, view entries, draw winners
4. Switch between sites as needed

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (multi-database connections)
- shadcn/ui components
