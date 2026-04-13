'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      router.push('/')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#ff9900] flex items-center justify-center">
              <span className="text-black font-bold text-lg">O</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#ededed]">
            OCTANE <span className="text-[#ff9900]">MASTER CONTROL CENTER</span>
          </h1>
          <p className="text-[#888] mt-2 text-sm">CEO Dashboard - Octane Multimedia</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#111] border border-[#222] rounded-xl p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-[#888] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-[#ededed] placeholder-[#555]"
              placeholder="admin@octanemultimedia.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#888] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-[#ededed] placeholder-[#555]"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="text-[#ef4444] text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#ff9900] hover:bg-[#ffad33] text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[#555] text-xs mt-6">
          Admin access only. Contact IT for credentials.
        </p>
      </div>
    </div>
  )
}
