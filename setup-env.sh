#!/bin/bash

echo "# Sweeps Admin Environment Variables" > .env.local
echo "" >> .env.local
echo "# AnyTrivia Sweeps" >> .env.local
echo "NEXT_PUBLIC_ANYTRIVIA_SUPABASE_URL=" >> .env.local
echo "NEXT_PUBLIC_ANYTRIVIA_SUPABASE_ANON_KEY=" >> .env.local
echo "" >> .env.local
echo "# Cooking Curiosity Sweeps" >> .env.local
echo "NEXT_PUBLIC_CCS_SUPABASE_URL=" >> .env.local
echo "NEXT_PUBLIC_CCS_SUPABASE_ANON_KEY=" >> .env.local
echo "" >> .env.local
echo "# MarketGrow Sweeps" >> .env.local
echo "NEXT_PUBLIC_MGS_SUPABASE_URL=" >> .env.local
echo "NEXT_PUBLIC_MGS_SUPABASE_ANON_KEY=" >> .env.local
echo "" >> .env.local
echo "# TriviaBright Sweeps" >> .env.local
echo "NEXT_PUBLIC_TRIVIABRIGHT_SUPABASE_URL=" >> .env.local
echo "NEXT_PUBLIC_TRIVIABRIGHT_SUPABASE_ANON_KEY=" >> .env.local
echo "" >> .env.local
echo "# Admin Auth (use AnyTrivia Supabase)" >> .env.local
echo "NEXT_PUBLIC_ADMIN_SUPABASE_URL=" >> .env.local
echo "NEXT_PUBLIC_ADMIN_SUPABASE_ANON_KEY=" >> .env.local
echo "" >> .env.local
echo "# Admin Email Whitelist" >> .env.local
echo "NEXT_PUBLIC_ADMIN_EMAILS=parker@worldwidedigital.com" >> .env.local

echo "✅ Created .env.local template"
echo "📝 Please fill in the Supabase URLs and keys"
