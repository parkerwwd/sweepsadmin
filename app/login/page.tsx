'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAdminClient } from '@/lib/supabase-clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gift } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [configStatus, setConfigStatus] = useState<string>('Checking...')
  const router = useRouter()
  const [supabase] = useState(() => {
    try {
      const client = getAdminClient()
      setConfigStatus('✅ Supabase connected')
      return client
    } catch (err: any) {
      setError('Configuration error: ' + err.message)
      setConfigStatus('❌ Not configured')
      return null
    }
  })

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      if (!supabase) return
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          window.location.href = '/dashboard'
        }
      } catch (err) {
        console.error('Session check error:', err)
      }
    }
    checkSession()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDebugInfo('')

    if (!supabase) {
      setError('Admin client not configured. Check environment variables.')
      setLoading(false)
      return
    }

    try {
      console.log('Attempting login for:', email)
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Login response:', { user: data?.user?.email, error: signInError?.message })

      if (signInError) {
        console.error('Sign in error:', signInError)
        throw new Error(signInError.message)
      }

      if (!data.user) {
        throw new Error('No user returned from authentication')
      }

      // Check if user is authorized admin
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) || ['parker@worldwidedigital.com']
      
      console.log('Checking authorization:', { userEmail: data.user.email, adminEmails })
      
      if (!adminEmails.includes(data.user.email || '')) {
        await supabase.auth.signOut()
        throw new Error(`Unauthorized: ${data.user.email} is not in the admin whitelist`)
      }

      console.log('Auth successful, redirecting...')
      // Use window.location to ensure cookies are properly set
      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to sign in')
      setDebugInfo(`Email: ${email}, Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-3 w-fit shadow-lg">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Sweeps Admin</CardTitle>
            <CardDescription className="mt-2">
              Multi-Site Giveaway Management
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
                {debugInfo && (
                  <p className="text-xs mt-2 opacity-75">{debugInfo}</p>
                )}
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-all"
              disabled={loading || !supabase}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Connection Status */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Connection Status: {configStatus}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-gray-400 text-center mt-1">
                  Admin Email Whitelist: {process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'parker@worldwidedigital.com'}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

