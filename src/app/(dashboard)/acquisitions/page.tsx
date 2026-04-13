'use client'

import { useState, useEffect } from 'react'

interface Acquisition {
  id: string
  title: string
  synopsis: string | null
  cast: string | null
  budget: number | null
  status: string
  notes: string | null
  createdAt: string
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    passed: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

const emptyForm = { title: '', synopsis: '', cast: '', budget: '', status: 'new', notes: '' }

export default function AcquisitionsPage() {
  const [items, setItems] = useState<Acquisition[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    try {
      const res = await fetch('/api/acquisitions')
      if (res.ok) setItems(await res.json())
    } catch (err) {
      console.error('Failed to load acquisitions', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveItem() {
    const method = editingId ? 'PUT' : 'POST'
    const url = editingId ? `/api/acquisitions/${editingId}` : '/api/acquisitions'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowModal(false)
    setForm(emptyForm)
    setEditingId(null)
    fetchItems()
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this acquisition?')) return
    await fetch(`/api/acquisitions/${id}`, { method: 'DELETE' })
    if (expandedId === id) setExpandedId(null)
    fetchItems()
  }

  function openEdit(item: Acquisition) {
    setForm({
      title: item.title,
      synopsis: item.synopsis || '',
      cast: item.cast || '',
      budget: item.budget?.toString() || '',
      status: item.status,
      notes: item.notes || '',
    })
    setEditingId(item.id)
    setShowModal(true)
  }

  async function evaluate(item: Acquisition) {
    setAiLoading(item.id)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'evaluate_acquisition', data: { synopsis: item.synopsis, cast: item.cast } }),
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

  if (loading) return <p className="text-sm text-gray-500">Loading acquisitions...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Acquisitions</h1>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true) }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Submission
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Cast</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date Added</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <>
                <tr
                  key={item.id}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                  <td className="px-4 py-3 text-gray-600">{item.cast || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.budget ? `$${Number(item.budget).toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-gray-600">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => evaluate(item)}
                        disabled={aiLoading === item.id}
                        className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {aiLoading === item.id ? 'Loading...' : '\u2728 Evaluate'}
                      </button>
                      <button onClick={() => openEdit(item)} className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => deleteItem(item.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
                {expandedId === item.id && (
                  <tr key={`${item.id}-expanded`}>
                    <td colSpan={6} className="bg-gray-50 px-6 py-4">
                      {item.synopsis && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-500">Synopsis</p>
                          <p className="text-sm text-gray-700">{item.synopsis}</p>
                        </div>
                      )}
                      {item.notes && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">Notes</p>
                          <p className="text-sm text-gray-700">{item.notes}</p>
                        </div>
                      )}
                      {!item.synopsis && !item.notes && (
                        <p className="text-sm text-gray-400">No additional details</p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">No acquisitions yet</p>
        )}
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{editingId ? 'Edit Acquisition' : 'New Submission'}</h2>
            <div className="space-y-3">
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <textarea
                placeholder="Synopsis"
                value={form.synopsis}
                onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                placeholder="Cast"
                value={form.cast}
                onChange={(e) => setForm({ ...form, cast: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                placeholder="Budget"
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="new">New</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="passed">Passed</option>
              </select>
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowModal(false); setEditingId(null) }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={saveItem} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900">AI Evaluation</h2>
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
