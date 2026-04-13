'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Settings,
  Mail,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Zap,
  ExternalLink,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { format, formatDistanceToNow } from 'date-fns'

interface PollLogEntry {
  id: string
  poll_type: string
  status: string
  emails_processed: number
  events_processed: number
  alerts_created: number
  error_message: string | null
  duration_ms: number | null
  createdAt: string
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [webhookUrl, setWebhookUrl] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  })

  useEffect(() => {
    if (settings?.cliq_webhook_url) {
      setWebhookUrl(settings.cliq_webhook_url)
    }
  }, [settings?.cliq_webhook_url])

  const saveWebhookMutation = useMutation({
    mutationFn: (url: string) =>
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliq_webhook_url: url }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const syncMutation = useMutation({
    mutationFn: () =>
      fetch('/api/cron/poll', {
        method: 'POST',
        headers: { 'x-cron-secret': 'manual-sync' },
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const recentPolls: PollLogEntry[] = settings?.recent_polls || []

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#ededed]">Settings</h1>
        <p className="text-[#888] text-sm mt-1">Configure MCC integrations</p>
      </div>

      {/* Google Account */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111] border border-[#222] rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-[#ff9900]" />
          <h2 className="font-semibold text-[#ededed]">Google Account</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            {settings?.google_connected ? (
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-[#22c55e]" />
                <span className="text-sm text-[#22c55e]">Connected</span>
                <span className="text-sm text-[#888]">- {settings.google_email}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-[#ef4444]" />
                <span className="text-sm text-[#ef4444]">Not connected</span>
              </div>
            )}
            <p className="text-xs text-[#666] mt-1">
              Gmail (read-only) and Google Calendar (read-only) access
            </p>
          </div>
          <a
            href="/api/google/auth"
            className="flex items-center gap-2 px-4 py-2 bg-[#ff9900]/10 text-[#ff9900] border border-[#ff9900]/20 rounded-lg text-sm hover:bg-[#ff9900]/20 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {settings?.google_connected ? 'Reconnect' : 'Connect Google'}
          </a>
        </div>
      </motion.div>

      {/* Zoho Cliq */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#111] border border-[#222] rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-[#ff9900]" />
          <h2 className="font-semibold text-[#ededed]">Zoho Cliq</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#888] mb-2">Webhook URL</label>
            <div className="flex gap-3">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://cliq.zoho.com/webhook/..."
                className="flex-1 px-4 py-2.5 bg-[#0a0a0a] border border-[#333] rounded-lg text-[#ededed] text-sm placeholder-[#555]"
              />
              <button
                onClick={() => saveWebhookMutation.mutate(webhookUrl)}
                disabled={saveWebhookMutation.isPending}
                className="px-4 py-2 bg-[#ff9900] text-black text-sm font-medium rounded-lg hover:bg-[#ffad33] disabled:opacity-50 transition-colors"
              >
                {saveWebhookMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {settings?.cliq_webhook_url && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#22c55e]" />
              <span className="text-sm text-[#22c55e]">Webhook configured</span>
            </div>
          )}

          {testResult && (
            <p className={`text-sm ${testResult === 'success' ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              {testResult === 'success' ? 'Test notification sent!' : 'Test failed. Check webhook URL.'}
            </p>
          )}
        </div>
      </motion.div>

      {/* Sync */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#111] border border-[#222] rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-[#ff9900]" />
            <h2 className="font-semibold text-[#ededed]">Data Sync</h2>
          </div>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff9900] text-black text-sm font-medium rounded-lg hover:bg-[#ffad33] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {settings?.last_poll && (
          <p className="text-sm text-[#888] mb-4">
            Last sync: {formatDistanceToNow(new Date(settings.last_poll), { addSuffix: true })}
            {' - '}
            <span className={settings.last_poll_status === 'success' ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
              {settings.last_poll_status}
            </span>
          </p>
        )}

        {syncMutation.isSuccess && (
          <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-[#22c55e]">
              Sync complete! Emails: {syncMutation.data?.emails_processed || 0},
              Events: {syncMutation.data?.events_processed || 0},
              Alerts: {syncMutation.data?.alerts_created || 0}
            </p>
          </div>
        )}

        {/* Poll History */}
        {recentPolls.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[#888] mb-3">Recent Sync History</h3>
            <div className="space-y-2">
              {recentPolls.map((poll) => (
                <div
                  key={poll.id}
                  className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#222] text-xs"
                >
                  <div className="flex items-center gap-3">
                    {poll.status === 'success' ? (
                      <CheckCircle className="w-3 h-3 text-[#22c55e]" />
                    ) : poll.status === 'error' ? (
                      <XCircle className="w-3 h-3 text-[#ef4444]" />
                    ) : (
                      <Clock className="w-3 h-3 text-[#888]" />
                    )}
                    <span className={poll.status === 'success' ? 'text-[#22c55e]' : poll.status === 'error' ? 'text-[#ef4444]' : 'text-[#888]'}>
                      {poll.status}
                    </span>
                    <span className="text-[#666]">
                      {poll.emails_processed}e / {poll.events_processed}ev / {poll.alerts_created}a
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[#666]">
                    {poll.duration_ms && <span>{poll.duration_ms}ms</span>}
                    <span>{format(new Date(poll.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
