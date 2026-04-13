'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Plus, Trash2, Clock, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  source_type: string | null
  createdAt: string
}

const priorityColors: Record<string, string> = {
  high: 'bg-[#ef4444]',
  medium: 'bg-[#f59e0b]',
  low: 'bg-[#22c55e]',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export default function TasksPage() {
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetch('/api/tasks').then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (task: { title: string; priority: string; due_date?: string }) =>
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setNewTitle('')
      setNewPriority('medium')
      setNewDueDate('')
      setShowNewTask(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: string; priority?: string }) =>
      fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/tasks/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const tasks: Task[] = data?.data || []

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    createMutation.mutate({
      title: newTitle.trim(),
      priority: newPriority,
      due_date: newDueDate || undefined,
    })
  }

  function cycleStatus(task: Task) {
    const order = ['pending', 'in_progress', 'completed']
    const idx = order.indexOf(task.status)
    const next = order[(idx + 1) % order.length]
    updateMutation.mutate({ id: task.id, status: next })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#ededed]">Tasks</h1>
          <p className="text-[#888] text-sm mt-1">
            {tasks.filter((t) => t.status !== 'completed').length} open tasks
          </p>
        </div>
        <button
          onClick={() => setShowNewTask(!showNewTask)}
          className="flex items-center gap-2 px-4 py-2 bg-[#ff9900] text-black text-sm font-medium rounded-lg hover:bg-[#ffad33] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* New Task Form */}
      <AnimatePresence>
        {showNewTask && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="bg-[#111] border border-[#222] rounded-xl p-5 space-y-4 overflow-hidden"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#333] rounded-lg text-[#ededed] text-sm placeholder-[#555]"
              autoFocus
            />
            <div className="flex items-center gap-4">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-[#ededed]"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-[#ededed]"
              />
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setShowNewTask(false)}
                className="px-4 py-2 text-sm text-[#888] hover:text-[#ededed]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim() || createMutation.isPending}
                className="px-4 py-2 bg-[#ff9900] text-black text-sm font-medium rounded-lg hover:bg-[#ffad33] disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Task List */}
      {isLoading ? (
        <div className="text-center py-12 text-[#888]">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="w-12 h-12 text-[#333] mx-auto mb-3" />
          <p className="text-[#888]">No tasks yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className={`bg-[#111] border border-[#222] rounded-xl p-4 flex items-center gap-4 hover:border-[#333] transition-colors ${
                  task.status === 'completed' ? 'opacity-50' : ''
                }`}
              >
                {/* Priority dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority] || priorityColors.medium}`} />

                {/* Status toggle */}
                <button
                  onClick={() => cycleStatus(task)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border flex-shrink-0 ${
                    task.status === 'completed'
                      ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20'
                      : task.status === 'in_progress'
                        ? 'bg-[#ff9900]/10 text-[#ff9900] border-[#ff9900]/20'
                        : 'bg-[#222] text-[#888] border-[#333]'
                  }`}
                >
                  {statusLabels[task.status] || task.status}
                </button>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.status === 'completed' ? 'text-[#666] line-through' : 'text-[#ededed]'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-[#666] truncate mt-0.5">{task.description}</p>
                  )}
                </div>

                {/* Due date */}
                {task.due_date && (
                  <span className="text-[10px] text-[#666] flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {format(new Date(task.due_date), 'MMM d')}
                  </span>
                )}

                {/* Source badge */}
                {task.source_type && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#222] text-[#666] flex-shrink-0">
                    {task.source_type}
                  </span>
                )}

                {/* Delete */}
                <button
                  onClick={() => deleteMutation.mutate(task.id)}
                  className="p-1.5 text-[#666] hover:text-[#ef4444] transition-colors rounded-lg hover:bg-[#1a1a1a] flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
