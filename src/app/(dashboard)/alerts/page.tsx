'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertTriangle, Info, CheckCircle, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Alert {
  id: string
  type: string
  severity: string
  title: string
  message: string
  source_type: string | null
  source_id: string | null
  acknowledged: boolean
  sent_to_cliq: boolean
  createdAt: string
}

const severityConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  critical: { icon: AlertTriangle, color: 'text-[#ef4444]', bg: 'bg-red-500/5', border: 'border-red-500/20' },
  warning: { icon: AlertTriangle, color: 'text-[#f59e0b]', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20' },
  info: { icon: Info, color: 'text-[#3b82f6]', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
}

export default function AlertsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => fetch('/api/alerts').then((r) => r.json()),
  })

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged: true }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const alerts: Alert[] = data?.data || []
  const unacknowledged = alerts.filter((a) => !a.acknowledged)
  const acknowledged = alerts.filter((a) => a.acknowledged)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#ededed]">Alerts</h1>
          <p className="text-[#888] text-sm mt-1">
            {unacknowledged.length} unacknowledged alert{unacknowledged.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[#888]">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-[#333] mx-auto mb-3" />
          <p className="text-[#888]">No alerts</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unacknowledged */}
          {unacknowledged.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#888] mb-3 uppercase tracking-wider">Active</h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {unacknowledged.map((alert) => {
                    const config = severityConfig[alert.severity] || severityConfig.info
                    const Icon = config.icon

                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className={`${config.bg} border ${config.border} rounded-xl p-5`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Icon className={`w-5 h-5 ${config.color} mt-0.5 flex-shrink-0`} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-[#ededed]">{alert.title}</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                                  {alert.severity}
                                </span>
                                {alert.sent_to_cliq && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#222] text-[#888]">
                                    sent to Cliq
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-[#888]">{alert.message}</p>
                              <p className="text-[10px] text-[#666] mt-2">
                                {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                                {alert.type && ` \u00B7 ${alert.type}`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => acknowledgeMutation.mutate(alert.id)}
                            disabled={acknowledgeMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#111] border border-[#333] rounded-lg text-[#888] hover:text-[#22c55e] hover:border-[#22c55e]/30 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Acknowledge
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Acknowledged */}
          {acknowledged.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#888] mb-3 uppercase tracking-wider">Acknowledged</h2>
              <div className="space-y-2">
                {acknowledged.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-[#111] border border-[#222] rounded-xl p-4 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#888] truncate">{alert.title}</p>
                      </div>
                      <span className="text-[10px] text-[#666]">
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
