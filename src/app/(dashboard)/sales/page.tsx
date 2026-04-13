'use client'

import { useState, useEffect } from 'react'

interface Deal {
  id: string
  film_id: string
  territory: string
  buyer: string | null
  status: string
  amount: number | null
  notes: string | null
}

interface Film {
  id: string
  title: string
  genre: string | null
  status: string
  territories: string | null
  buyers: string | null
  last_contact_date: string | null
  notes: string | null
  deals: Deal[]
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    in_negotiation: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-green-100 text-green-800',
    dead: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

const emptyFilm = { title: '', genre: '', status: 'available', territories: '', notes: '' }
const emptyDeal = { territory: '', buyer: '', status: 'pending', amount: '', notes: '' }

export default function SalesPage() {
  const [films, setFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFilmModal, setShowFilmModal] = useState(false)
  const [filmForm, setFilmForm] = useState(emptyFilm)
  const [editingFilmId, setEditingFilmId] = useState<string | null>(null)
  const [showDealModal, setShowDealModal] = useState(false)
  const [dealForm, setDealForm] = useState(emptyDeal)
  const [dealFilmId, setDealFilmId] = useState<string | null>(null)
  const [editingDealId, setEditingDealId] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)

  useEffect(() => { fetchFilms() }, [])

  async function fetchFilms() {
    try {
      const res = await fetch('/api/sales')
      if (res.ok) setFilms(await res.json())
    } catch (err) {
      console.error('Failed to load films', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveFilm() {
    const method = editingFilmId ? 'PUT' : 'POST'
    const url = editingFilmId ? `/api/sales/${editingFilmId}` : '/api/sales'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(filmForm) })
    setShowFilmModal(false)
    setFilmForm(emptyFilm)
    setEditingFilmId(null)
    fetchFilms()
  }

  async function deleteFilm(id: string) {
    if (!confirm('Delete this film and all its deals?')) return
    await fetch(`/api/sales/${id}`, { method: 'DELETE' })
    if (expandedId === id) setExpandedId(null)
    fetchFilms()
  }

  function openEditFilm(film: Film) {
    setFilmForm({
      title: film.title,
      genre: film.genre || '',
      status: film.status,
      territories: film.territories || '',
      notes: film.notes || '',
    })
    setEditingFilmId(film.id)
    setShowFilmModal(true)
  }

  async function saveDeal() {
    const method = editingDealId ? 'PUT' : 'POST'
    const url = editingDealId ? `/api/deals/${editingDealId}` : '/api/deals'
    const body = editingDealId
      ? dealForm
      : { ...dealForm, film_id: dealFilmId }
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowDealModal(false)
    setDealForm(emptyDeal)
    setDealFilmId(null)
    setEditingDealId(null)
    fetchFilms()
  }

  async function deleteDeal(id: string) {
    if (!confirm('Delete this deal?')) return
    await fetch(`/api/deals/${id}`, { method: 'DELETE' })
    fetchFilms()
  }

  function openEditDeal(deal: Deal) {
    setDealForm({
      territory: deal.territory,
      buyer: deal.buyer || '',
      status: deal.status,
      amount: deal.amount?.toString() || '',
      notes: deal.notes || '',
    })
    setEditingDealId(deal.id)
    setShowDealModal(true)
  }

  async function draftFollowUp(film: Film) {
    setAiLoading(film.id)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'draft_followup', data: { title: film.title, notes: film.notes } }),
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

  if (loading) return <p className="text-sm text-gray-500">Loading sales library...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sales Library</h1>
        <button
          onClick={() => { setFilmForm(emptyFilm); setEditingFilmId(null); setShowFilmModal(true) }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Film
        </button>
      </div>

      {/* Films Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Genre</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Territories</th>
              <th className="px-4 py-3">Last Contact</th>
              <th className="px-4 py-3">Deals</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {films.map((film) => (
              <>
                <tr
                  key={film.id}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === film.id ? null : film.id)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{film.title}</td>
                  <td className="px-4 py-3 text-gray-600">{film.genre || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={film.status} /></td>
                  <td className="px-4 py-3 text-gray-600">{film.territories || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {film.last_contact_date ? new Date(film.last_contact_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{film.deals?.length || 0}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => draftFollowUp(film)}
                        disabled={aiLoading === film.id}
                        className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {aiLoading === film.id ? 'Loading...' : '\u2728 Draft Follow-up'}
                      </button>
                      <button onClick={() => openEditFilm(film)} className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => deleteFilm(film.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
                {expandedId === film.id && (
                  <tr key={`${film.id}-expanded`}>
                    <td colSpan={7} className="bg-gray-50 px-6 py-4">
                      {film.notes && <p className="mb-3 text-sm text-gray-600"><span className="font-medium">Notes:</span> {film.notes}</p>}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Deals</h3>
                        <button
                          onClick={() => { setDealForm(emptyDeal); setDealFilmId(film.id); setEditingDealId(null); setShowDealModal(true) }}
                          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          Add Deal
                        </button>
                      </div>
                      {film.deals && film.deals.length > 0 ? (
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 text-gray-500">
                              <th className="px-3 py-2">Territory</th>
                              <th className="px-3 py-2">Buyer</th>
                              <th className="px-3 py-2">Status</th>
                              <th className="px-3 py-2">Amount</th>
                              <th className="px-3 py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {film.deals.map((deal) => (
                              <tr key={deal.id} className="border-b border-gray-100 hover:bg-white">
                                <td className="px-3 py-2 text-gray-900">{deal.territory}</td>
                                <td className="px-3 py-2 text-gray-600">{deal.buyer || '-'}</td>
                                <td className="px-3 py-2"><StatusBadge status={deal.status} /></td>
                                <td className="px-3 py-2 text-gray-600">{deal.amount ? `$${Number(deal.amount).toLocaleString()}` : '-'}</td>
                                <td className="px-3 py-2">
                                  <button onClick={() => openEditDeal(deal)} className="mr-2 text-blue-600 hover:underline">Edit</button>
                                  <button onClick={() => deleteDeal(deal.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-xs text-gray-400">No deals yet</p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {films.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">No films in the sales library</p>
        )}
      </div>

      {/* Film Modal */}
      {showFilmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{editingFilmId ? 'Edit Film' : 'Add Film'}</h2>
            <div className="space-y-3">
              <input
                placeholder="Title"
                value={filmForm.title}
                onChange={(e) => setFilmForm({ ...filmForm, title: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                placeholder="Genre"
                value={filmForm.genre}
                onChange={(e) => setFilmForm({ ...filmForm, genre: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={filmForm.status}
                onChange={(e) => setFilmForm({ ...filmForm, status: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="in_negotiation">In Negotiation</option>
                <option value="sold">Sold</option>
              </select>
              <input
                placeholder="Territories (comma-separated)"
                value={filmForm.territories}
                onChange={(e) => setFilmForm({ ...filmForm, territories: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <textarea
                placeholder="Notes"
                value={filmForm.notes}
                onChange={(e) => setFilmForm({ ...filmForm, notes: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowFilmModal(false); setEditingFilmId(null) }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveFilm}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {editingFilmId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Modal */}
      {showDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{editingDealId ? 'Edit Deal' : 'Add Deal'}</h2>
            <div className="space-y-3">
              <input
                placeholder="Territory"
                value={dealForm.territory}
                onChange={(e) => setDealForm({ ...dealForm, territory: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                placeholder="Buyer"
                value={dealForm.buyer}
                onChange={(e) => setDealForm({ ...dealForm, buyer: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={dealForm.status}
                onChange={(e) => setDealForm({ ...dealForm, status: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_negotiation">In Negotiation</option>
                <option value="closed">Closed</option>
                <option value="dead">Dead</option>
              </select>
              <input
                placeholder="Amount"
                type="number"
                value={dealForm.amount}
                onChange={(e) => setDealForm({ ...dealForm, amount: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <textarea
                placeholder="Notes"
                value={dealForm.notes}
                onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowDealModal(false); setEditingDealId(null) }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveDeal}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {editingDealId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Result Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">AI Draft Follow-up</h2>
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
              <button
                onClick={() => setShowAiModal(false)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
