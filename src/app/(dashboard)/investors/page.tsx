'use client'

import { useState, useEffect } from 'react'

interface MccInvestor {
  id: string
  name: string
  email: string | null
  investments: string | null
  notes: string | null
  payment_status: string
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    current: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

const emptyForm = { name: '', email: '', investments: '', notes: '', payment_status: 'current' }

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<MccInvestor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)

  useEffect(() => { fetchInvestors() }, [])

  async function fetchInvestors() {
    try {
      const res = await fetch('/api/investors')
      if (res.ok) setInvestors(await res.json())
    } catch (err) {
      console.error('Failed to load investors', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveInvestor() {
    const method = editingId ? 'PUT' : 'POST'
    const url = editingId ? `/api/investors/${editingId}` : '/api/investors'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowModal(false)
    setForm(emptyForm)
    setEditingId(null)
    fetchInvestors()
  }

  async function deleteInvestor(id: string) {
    if (!confirm('Delete this investor?')) return
    await fetch(`/api/investors/${id}`, { method: 'DELETE' })
    fetchInvestors()
  }

  function openEdit(inv: MccInvestor) {
    setForm({
      name: inv.name,
      email: inv.email || '',
      investments: inv.investments || '',
      notes: inv.notes || '',
      payment_status: inv.payment_status,
    })
    setEditingId(inv.id)
    setShowModal(true)
  }

  async function draftUpdate(inv: MccInvestor) {
    setAiLoading(inv.id)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'investor_update', data: { notes: inv.notes } }),
      })
      const json = await res.json()
      setAiResult(json.result || json.error || 'No response')
      setShowAiModal(true)
    } catch {
      setAiResult('Failed to get AI response')
      setShowAiModal(true)
    } finally {
      setAiLoading(null)
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading investors...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Investors</h1>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true) }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Investor
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {investors.map((inv) => (
          <div key={inv.id} className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{inv.name}</h3>
                {inv.email && <p className="mt-0.5 text-xs text-gray-500">{inv.email}</p>}
              </div>
              <StatusBadge status={inv.payment_status} />
            </div>
            {inv.investments && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500">Investments</p>
                <p className="text-sm text-gray-700">{inv.investments}</p>
              </div>
            )}
            {inv.notes && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-500">Notes</p>
                <p className="text-sm text-gray-600 line-clamp-2">{inv.notes}</p>
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
              <button
                onClick={() => draftUpdate(inv)}
                disabled={aiLoading === inv.id}
                className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {aiLoading === inv.id ? 'Loading...' : '\u2728 Draft Update'}
              </button>
              <button onClick={() => openEdit(inv)} className="text-xs text-blue-600 hover:underline">Edit</button>
              <button onClick={() => deleteInvestor(inv.id)} className="text-xs text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
      {investors.length === 0 && (
        <p className="text-center text-sm text-gray-400">No investors yet</p>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{editingId ? 'Edit Investor' : 'Add Investor'}</h2>
            <div className="space-y-3">
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <textarea
                placeholder="Investments"
                value={form.investments}
                onChange={(e) => setForm({ ...form, investments: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={form.payment_status}
                onChange={(e) => setForm({ ...form, payment_status: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="current">Current</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowModal(false); setEditingId(null) }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={saveInvestor} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Result Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">AI Investor Update</h2>
            <div className="max-h-96 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-sm text-gray-800">{aiResult}</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { if (aiResult) navigator.clipboard.writeText(aiResult) }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Copy
              </button>
              <button onClick={() => setShowAiModal(false)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
