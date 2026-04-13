'use client'

import { useState, useEffect } from 'react'

interface Meeting {
  id: string
  title: string
  participants: string | null
  date: string | null
  notes: string | null
}

const emptyForm = { title: '', participants: '', date: '', notes: '' }

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)

  useEffect(() => { fetchMeetings() }, [])

  async function fetchMeetings() {
    try {
      const res = await fetch('/api/meetings')
      if (res.ok) setMeetings(await res.json())
    } catch (err) {
      console.error('Failed to load meetings', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveMeeting() {
    const method = editingId ? 'PUT' : 'POST'
    const url = editingId ? `/api/meetings/${editingId}` : '/api/meetings'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowModal(false)
    setForm(emptyForm)
    setEditingId(null)
    fetchMeetings()
  }

  async function deleteMeeting(id: string) {
    if (!confirm('Delete this meeting?')) return
    await fetch(`/api/meetings/${id}`, { method: 'DELETE' })
    if (expandedId === id) setExpandedId(null)
    fetchMeetings()
  }

  function openEdit(m: Meeting) {
    setForm({
      title: m.title,
      participants: m.participants || '',
      date: m.date ? m.date.split('T')[0] : '',
      notes: m.notes || '',
    })
    setEditingId(m.id)
    setShowModal(true)
  }

  async function prepMeeting(m: Meeting) {
    setAiLoading(m.id)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prep_meeting', data: { notes: m.notes, participants: m.participants } }),
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

  if (loading) return <p className="text-sm text-gray-500">Loading meetings...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true) }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Meeting
        </button>
      </div>

      <div className="space-y-3">
        {meetings.map((m) => (
          <div key={m.id} className="rounded-lg border border-gray-200 bg-white">
            <div
              className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
              onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
            >
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{m.title}</h3>
                <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                  {m.date && <span>{new Date(m.date).toLocaleDateString()}</span>}
                  {m.participants && <span>{m.participants}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => prepMeeting(m)}
                  disabled={aiLoading === m.id}
                  className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {aiLoading === m.id ? 'Loading...' : '\u2728 Prep Meeting'}
                </button>
                <button onClick={() => openEdit(m)} className="text-xs text-blue-600 hover:underline">Edit</button>
                <button onClick={() => deleteMeeting(m.id)} className="text-xs text-red-600 hover:underline">Delete</button>
              </div>
            </div>
            {expandedId === m.id && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                {m.notes ? (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Notes</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{m.notes}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No notes</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {meetings.length === 0 && (
        <p className="text-center text-sm text-gray-400">No meetings yet</p>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{editingId ? 'Edit Meeting' : 'New Meeting'}</h2>
            <div className="space-y-3">
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                placeholder="Participants (comma-separated)"
                value={form.participants}
                onChange={(e) => setForm({ ...form, participants: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={4}
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
              <button onClick={saveMeeting} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900">AI Meeting Prep</h2>
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
