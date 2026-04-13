'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Mail,
  CheckSquare,
  Calendar,
  Film,
  RefreshCw,
  Clock,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

function StatCard({
  title,
  value,
  icon: Icon,
  color = '#ff9900',
  subtitle,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color?: string
  subtitle?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111] border border-[#222] rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#888] text-sm">{title}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-2xl font-bold text-[#ededed]">{value}</p>
      {subtitle && <p className="text-xs text-[#666] mt-1">{subtitle}</p>}
    </motion.div>
  )
}

function PollStatusBar() {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  })

  const syncMutation = useMutation({
    mutationFn: () =>
      fetch('/api/cron/poll', {
        method: 'POST',
        headers: { 'x-cron-secret': 'manual-sync' },
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  })

  const googleConnected = !!settings?.google_email
  const cliqConnected = !!settings?.cliq_webhook_url

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#ff9900]" />
          <span className="text-sm font-medium text-[#ededed]">System Status</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            {googleConnected ? (
              <Wifi className="w-3 h-3 text-[#22c55e]" />
            ) : (
              <WifiOff className="w-3 h-3 text-[#ef4444]" />
            )}
            <span className={googleConnected ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
              Gmail
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {cliqConnected ? (
              <Wifi className="w-3 h-3 text-[#22c55e]" />
            ) : (
              <WifiOff className="w-3 h-3 text-[#666]" />
            )}
            <span className={cliqConnected ? 'text-[#22c55e]' : 'text-[#666]'}>
              Cliq
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {settings?.last_poll && (
          <span className="text-xs text-[#666]">
            Last sync: {formatDistanceToNow(new Date(settings.last_poll), { addSuffix: true })}
          </span>
        )}
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#ff9900]/10 text-[#ff9900] border border-[#ff9900]/20 rounded-lg hover:bg-[#ff9900]/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    </motion.div>
  )
}

export default function MissionControlPage() {
  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => fetch('/api/alerts?limit=5').then((r) => r.json()),
  })

  const { data: emails } = useQuery({
    queryKey: ['emails', 'important'],
    queryFn: () => fetch('/api/gmail?important=true&limit=5').then((r) => r.json()),
  })

  const { data: tasks } = useQuery({
    queryKey: ['tasks', 'pending'],
    queryFn: () => fetch('/api/tasks?status=pending&limit=5').then((r) => r.json()),
  })

  const { data: events } = useQuery({
    queryKey: ['calendar', 'upcoming'],
    queryFn: () => fetch('/api/calendar?days=7').then((r) => r.json()),
  })

  const { data: films } = useQuery({
    queryKey: ['films'],
    queryFn: () => fetch('/api/films').then((r) => r.json()),
  })

  const urgentAlerts = alerts?.data?.filter((a: { severity: string }) => a.severity === 'critical' || a.severity === 'warning') || []
  const importantEmails = emails?.data || []
  const pendingTasks = tasks?.data || []
  const upcomingEvents = events?.data || []
  const filmStats = films?.stats || { total: 0, inProduction: 0, released: 0 }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#ededed]">Mission Control</h1>
        <p className="text-[#888] text-sm mt-1">Octane Multimedia Command Center</p>
      </div>

      <PollStatusBar />

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Urgent Alerts"
          value={urgentAlerts.length}
          icon={AlertTriangle}
          color="#ef4444"
          subtitle="Needs attention"
        />
        <StatCard
          title="Unread Emails"
          value={importantEmails.length}
          icon={Mail}
          color="#ff9900"
          subtitle="Important flagged"
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks.length}
          icon={CheckSquare}
          color="#f59e0b"
          subtitle="Action required"
        />
        <StatCard
          title="Films Active"
          value={filmStats.inProduction || 0}
          icon={Film}
          color="#22c55e"
          subtitle={`${filmStats.total || 0} total`}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="col-span-2 space-y-6">
          {/* Urgent Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#111] border border-[#222] rounded-xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
                <h2 className="font-semibold text-[#ededed]">Urgent Alerts</h2>
              </div>
              <a href="/alerts" className="text-xs text-[#ff9900] hover:text-[#ffad33]">
                View all
              </a>
            </div>
            <div className="p-5">
              {urgentAlerts.length === 0 ? (
                <p className="text-[#666] text-sm">No urgent alerts. All clear.</p>
              ) : (
                <div className="space-y-3">
                  {urgentAlerts.slice(0, 5).map((alert: { id: string; severity: string; title: string; message: string; createdAt: string }) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${
                        alert.severity === 'critical'
                          ? 'bg-red-500/5 border-red-500/20'
                          : 'bg-yellow-500/5 border-yellow-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#ededed]">{alert.title}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            alert.severity === 'critical'
                              ? 'bg-red-500/20 text-[#ef4444]'
                              : 'bg-yellow-500/20 text-[#f59e0b]'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-[#888] mt-1">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Important Emails */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#111] border border-[#222] rounded-xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#ff9900]" />
                <h2 className="font-semibold text-[#ededed]">Important Emails</h2>
              </div>
              <a href="/communications" className="text-xs text-[#ff9900] hover:text-[#ffad33]">
                View all
              </a>
            </div>
            <div className="p-5">
              {importantEmails.length === 0 ? (
                <p className="text-[#666] text-sm">No important emails. Inbox is clear.</p>
              ) : (
                <div className="space-y-3">
                  {importantEmails.slice(0, 5).map((email: { id: string; from_name: string; from_address: string; subject: string; ai_summary: string; received_at: string; is_urgent: boolean }) => (
                    <div key={email.id} className="p-3 rounded-lg bg-[#0a0a0a] border border-[#222] hover:border-[#333] transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#ededed] truncate">
                          {email.from_name || email.from_address}
                        </span>
                        <div className="flex items-center gap-2">
                          {email.is_urgent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-[#ef4444]">
                              urgent
                            </span>
                          )}
                          <span className="text-[10px] text-[#666]">
                            {formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-[#888] mt-1 truncate">{email.subject}</p>
                      {email.ai_summary && (
                        <p className="text-xs text-[#666] mt-1 truncate">{email.ai_summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Pending Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#111] border border-[#222] rounded-xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#f59e0b]" />
                <h2 className="font-semibold text-[#ededed]">Pending Tasks</h2>
              </div>
              <a href="/tasks" className="text-xs text-[#ff9900] hover:text-[#ffad33]">
                View all
              </a>
            </div>
            <div className="p-5">
              {pendingTasks.length === 0 ? (
                <p className="text-[#666] text-sm">No pending tasks.</p>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.slice(0, 5).map((task: { id: string; title: string; priority: string; due_date: string | null }) => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-[#222]">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            task.priority === 'high' ? 'bg-[#ef4444]' :
                            task.priority === 'medium' ? 'bg-[#f59e0b]' : 'bg-[#22c55e]'
                          }`}
                        />
                        <span className="text-sm text-[#ededed]">{task.title}</span>
                      </div>
                      {task.due_date && (
                        <span className="text-[10px] text-[#666]">
                          Due {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#111] border border-[#222] rounded-xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#ff9900]" />
                <h2 className="font-semibold text-[#ededed]">Upcoming</h2>
              </div>
              <a href="/calendar" className="text-xs text-[#ff9900] hover:text-[#ffad33]">
                View all
              </a>
            </div>
            <div className="p-5">
              {upcomingEvents.length === 0 ? (
                <p className="text-[#666] text-sm">No upcoming events.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 7).map((event: { id: string; title: string; start_time: string; meet_link: string | null }) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 text-center">
                        <p className="text-[10px] text-[#666]">
                          {format(new Date(event.start_time), 'MMM d')}
                        </p>
                        <p className="text-xs font-medium text-[#ff9900]">
                          {format(new Date(event.start_time), 'h:mm a')}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-[#ededed] truncate">{event.title}</p>
                        {event.meet_link && (
                          <span className="text-[10px] text-[#22c55e]">Meet link</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Film Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[#111] border border-[#222] rounded-xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#22c55e]" />
                <h2 className="font-semibold text-[#ededed]">Film Library</h2>
              </div>
              <a href="/films" className="text-xs text-[#ff9900] hover:text-[#ffad33]">
                View all
              </a>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#888]">Total Films</span>
                <span className="text-sm font-medium text-[#ededed]">{filmStats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#888]">In Production</span>
                <span className="text-sm font-medium text-[#ff9900]">{filmStats.inProduction}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#888]">Released</span>
                <span className="text-sm font-medium text-[#22c55e]">{filmStats.released}</span>
              </div>
              {films?.totalBudget != null && (
                <div className="pt-3 border-t border-[#222]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#888]">Total Budget</span>
                    <span className="text-sm font-medium text-[#ededed]">
                      ${(films.totalBudget / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-[#888]">Total Revenue</span>
                    <span className="text-sm font-medium text-[#22c55e]">
                      ${(films.totalRevenue / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Numbers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-[#111] border border-[#222] rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#ff9900]" />
              <h2 className="font-semibold text-[#ededed]">Quick Numbers</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#888]">Today&apos;s Events</span>
                <span className="text-sm font-medium text-[#ededed]">
                  {upcomingEvents.filter((e: { start_time: string }) =>
                    format(new Date(e.start_time), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#888]">Open Alerts</span>
                <span className="text-sm font-medium text-[#ededed]">
                  {alerts?.data?.filter((a: { acknowledged: boolean }) => !a.acknowledged).length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#888]">High Priority</span>
                <span className="text-sm font-medium text-[#ef4444]">
                  {pendingTasks.filter((t: { priority: string }) => t.priority === 'high').length}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
