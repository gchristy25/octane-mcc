'use client'

import { useState, useEffect } from 'react'

interface Deal {
  id: string
  territory: string
  buyer: string | null
  status: string
  amount: number | null
  film: { title: string }
}

interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  status: string
}

interface Meeting {
  id: string
  title: string
  date: string | null
  participants: string | null
}

interface DashboardData {
  recentDeals: Deal[]
  pendingTasks: Task[]
  upcomingMeetings: Meeting[]
  alerts: string[]
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    in_negotiation: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-green-100 text-green-800',
    done: 'bg-green-100 text-green-800',
    dead: 'bg-red-100 text-red-800',
    available: 'bg-green-100 text-green-800',
    sold: 'bg-blue-100 text-blue-800',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [revenueTarget, setRevenueTarget] = useState('')
  const [editingRevenue, setEditingRevenue] = useState(false)
  const [revenueInput, setRevenueInput] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('octane_revenue_target')
    if (saved) setRevenueTarget(saved)
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Failed to load dashboard', err)
    } finally {
      setLoading(false)
    }
  }

  function saveRevenue() {
    localStorage.setItem('octane_revenue_target', revenueInput)
    setRevenueTarget(revenueInput)
    setEditingRevenue(false)
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading dashboard...</p>
  }

  const totalDeals = data?.recentDeals?.length ?? 0
  const pendingCount = data?.pendingTasks?.length ?? 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Recent Deals', value: totalDeals },
          { label: 'Upcoming Meetings', value: data?.upcomingMeetings?.length ?? 0 },
          { label: 'Pending Tasks', value: pendingCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Target */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Current Revenue Target</p>
            {revenueTarget ? (
              <p className="mt-1 text-2xl font-bold text-gray-900">
                ${Number(revenueTarget).toLocaleString()}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-400">Not set</p>
            )}
          </div>
          {!editingRevenue ? (
            <button
              onClick={() => { setRevenueInput(revenueTarget); setEditingRevenue(true) }}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              {revenueTarget ? 'Update' : 'Set Target'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={revenueInput}
                onChange={(e) => setRevenueInput(e.target.value)}
                placeholder="e.g. 500000"
                className="w-40 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={saveRevenue}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingRevenue(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, i) => (
            <div
              key={i}
              className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                alert.toLowerCase().includes('overdue')
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-yellow-200 bg-yellow-50 text-yellow-800'
              }`}
            >
              {alert}
            </div>
          ))}
        </div>
      )}

      {/* Two Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Deals */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Deals</h2>
          {data?.recentDeals && data.recentDeals.length > 0 ? (
            <div className="space-y-3">
              {data.recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between rounded-md border border-gray-100 p-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{deal.film?.title}</p>
                    <p className="text-xs text-gray-500">{deal.territory} {deal.buyer ? `- ${deal.buyer}` : ''}</p>
                  </div>
                  <StatusBadge status={deal.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No recent deals</p>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Meetings */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Upcoming Meetings</h2>
            {data?.upcomingMeetings && data.upcomingMeetings.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingMeetings.map((m) => (
                  <div key={m.id} className="rounded-md border border-gray-100 p-3 hover:bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">{m.title}</p>
                    <p className="text-xs text-gray-500">
                      {m.date ? new Date(m.date).toLocaleDateString() : 'No date'}
                      {m.participants ? ` - ${m.participants}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No upcoming meetings</p>
            )}
          </div>

          {/* Tasks Due */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Tasks Due</h2>
            {data?.pendingTasks && data.pendingTasks.length > 0 ? (
              <div className="space-y-3">
                {data.pendingTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-md border border-gray-100 p-3 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.title}</p>
                      <p className="text-xs text-gray-500">
                        {t.due_date ? `Due: ${new Date(t.due_date).toLocaleDateString()}` : 'No due date'}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No pending tasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
