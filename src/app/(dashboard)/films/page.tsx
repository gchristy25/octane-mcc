'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Film, DollarSign, TrendingUp, Layers } from 'lucide-react'

interface FilmItem {
  id: string
  title: string
  description: string | null
  genre: string | null
  status: string
  budget: number
  revenue: number
  poster_url: string | null
  release_date: string | null
  slate: { id: string; name: string } | null
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  development: { label: 'Development', color: 'text-[#3b82f6]', bg: 'bg-blue-500/10' },
  pre_production: { label: 'Pre-Production', color: 'text-[#8b5cf6]', bg: 'bg-purple-500/10' },
  production: { label: 'Production', color: 'text-[#ff9900]', bg: 'bg-orange-500/10' },
  in_production: { label: 'In Production', color: 'text-[#ff9900]', bg: 'bg-orange-500/10' },
  post_production: { label: 'Post-Production', color: 'text-[#f59e0b]', bg: 'bg-yellow-500/10' },
  released: { label: 'Released', color: 'text-[#22c55e]', bg: 'bg-green-500/10' },
  distributed: { label: 'Distributed', color: 'text-[#22c55e]', bg: 'bg-green-500/10' },
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
  return `$${amount.toFixed(0)}`
}

export default function FilmsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['films'],
    queryFn: () => fetch('/api/films').then((r) => r.json()),
  })

  const films: FilmItem[] = data?.data || []
  const stats = data?.stats || {}

  // Group by status
  const grouped: Record<string, FilmItem[]> = {}
  films.forEach((film) => {
    const status = film.status || 'development'
    if (!grouped[status]) grouped[status] = []
    grouped[status].push(film)
  })

  const statusOrder = ['development', 'pre_production', 'production', 'in_production', 'post_production', 'released', 'distributed']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#ededed]">Film Library</h1>
        <p className="text-[#888] text-sm mt-1">Octane Multimedia film catalog</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-[#222] rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#888] text-sm">Total Films</span>
            <Film className="w-4 h-4 text-[#ff9900]" />
          </div>
          <p className="text-2xl font-bold text-[#ededed]">{stats.total || 0}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#111] border border-[#222] rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#888] text-sm">In Production</span>
            <Layers className="w-4 h-4 text-[#ff9900]" />
          </div>
          <p className="text-2xl font-bold text-[#ff9900]">{stats.inProduction || 0}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111] border border-[#222] rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#888] text-sm">Total Budget</span>
            <DollarSign className="w-4 h-4 text-[#f59e0b]" />
          </div>
          <p className="text-2xl font-bold text-[#ededed]">
            {formatCurrency(data?.totalBudget || 0)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#111] border border-[#222] rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#888] text-sm">Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-[#22c55e]" />
          </div>
          <p className="text-2xl font-bold text-[#22c55e]">
            {formatCurrency(data?.totalRevenue || 0)}
          </p>
        </motion.div>
      </div>

      {/* Films by Status */}
      {isLoading ? (
        <div className="text-center py-12 text-[#888]">Loading films...</div>
      ) : films.length === 0 ? (
        <div className="text-center py-12">
          <Film className="w-12 h-12 text-[#333] mx-auto mb-3" />
          <p className="text-[#888]">No films in the library</p>
        </div>
      ) : (
        <div className="space-y-8">
          {statusOrder
            .filter((status) => grouped[status]?.length)
            .map((status) => {
              const config = statusConfig[status] || { label: status, color: 'text-[#888]', bg: 'bg-[#222]' }
              return (
                <div key={status}>
                  <h2 className={`text-sm font-semibold ${config.color} mb-3 flex items-center gap-2`}>
                    <span className={`w-2 h-2 rounded-full ${config.bg} ${config.color}`} />
                    {config.label} ({grouped[status].length})
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {grouped[status].map((film, i) => (
                      <motion.div
                        key={film.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-[#111] border border-[#222] rounded-xl p-5 hover:border-[#333] transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-[#ededed]">{film.title}</h3>
                            {film.genre && (
                              <span className="text-[10px] text-[#666] mt-0.5 block">{film.genre}</span>
                            )}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        {film.description && (
                          <p className="text-xs text-[#888] mb-3">
                            {film.description.substring(0, 120)}
                            {film.description.length > 120 ? '...' : ''}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs pt-3 border-t border-[#222]">
                          <div className="flex items-center gap-4">
                            <span className="text-[#888]">
                              Budget: <span className="text-[#ededed]">{formatCurrency(film.budget)}</span>
                            </span>
                            <span className="text-[#888]">
                              Revenue: <span className="text-[#22c55e]">{formatCurrency(film.revenue)}</span>
                            </span>
                          </div>
                          {film.slate && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#222] text-[#666]">
                              {film.slate.name}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
