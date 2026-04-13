'use client'

import { useState, useEffect } from 'react'

interface Task {
  id: string
  title: string
  description: string | null
  linked_entity_type: string | null
  linked_entity_id: string | null
  due_date: string | null
  status: string
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

const emptyForm = { title: '', description: '', linked_entity_type: '', linked_entity_id: '', due_date: '', status: 'pending' }

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) setTasks(await res.json())
    } catch (err) {
      console.error('Failed to load tasks', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveTask() {
    const method = editingId ? 'PUT' : 'POST'
    const url = editingId ? `/api/tasks/${editingId}` : '/api/tasks'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowModal(false)
    setForm(emptyForm)
    setEditingId(null)
    fetchTasks()
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    fetchTasks()
  }

  async function toggleStatus(task: Task) {
    const next: Record<string, string> = { pending: 'in_progress', in_progress: 'done', done: 'pending' }
    const newStatus = next[task.status] || 'pending'
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status: newStatus }),
    })
    fetchTasks()
  }

  function openEdit(task: Task) {
    setForm({
      title: task.title,
      description: task.description || '',
      linked_entity_type: task.linked_entity_type || '',
      linked_entity_id: task.linked_entity_id || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      status: task.status,
    })
    setEditingId(task.id)
    setShowModal(true)
  }

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)

  if (loading) return <p className="text-sm text-gray-500">Loading tasks...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true) }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'pending', 'in_progress', 'done'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'All' : f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {filtered.map((task) => (
          <div key={task.id} className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                  <StatusBadge status={task.status} />
                </div>
                {task.description && <p className="mt-1 text-sm text-gray-600">{task.description}</p>}
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  {task.due_date && (
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  )}
                  {task.linked_entity_type && (
                    <span>Linked: {task.linked_entity_type}{task.linked_entity_id ? ` (${task.linked_entity_id})` : ''}</span>
                  )}
                </div>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <button
                  onClick={() => toggleStatus(task)}
                  className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                >
                  {task.status === 'pending' ? 'Start' : task.status === 'in_progress' ? 'Complete' : 'Reopen'}
                </button>
                <button onClick={() => openEdit(task)} className="text-xs text-blue-600 hover:underline">Edit</button>
                <button onClick={() => deleteTask(task.id)} className="text-xs text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-sm text-gray-400">No tasks found</p>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{editingId ? 'Edit Task' : 'New Task'}</h2>
            <div className="space-y-3">
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={form.linked_entity_type}
                onChange={(e) => setForm({ ...form, linked_entity_type: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">No linked entity</option>
                <option value="film">Film</option>
                <option value="deal">Deal</option>
                <option value="acquisition">Acquisition</option>
                <option value="investor">Investor</option>
                <option value="meeting">Meeting</option>
              </select>
              {form.linked_entity_type && (
                <input
                  placeholder="Linked Entity ID"
                  value={form.linked_entity_id}
                  onChange={(e) => setForm({ ...form, linked_entity_id: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowModal(false); setEditingId(null) }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={saveTask} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
