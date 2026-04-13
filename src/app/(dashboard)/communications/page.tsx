'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Star, AlertTriangle, Filter, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

const CATEGORIES = [
  'all',
  'investor',
  'distribution',
  'production',
  'legal',
  'talent',
  'marketing',
  'operations',
  'personal',
]

interface EmailDigest {
  id: string
  gmail_id: string
  from_address: string
  from_name: string | null
  subject: string
  snippet: string | null
  received_at: string
  is_important: boolean
  is_urgent: boolean
  category: string | null
  ai_summary: string | null
  ai_action_items: string | null
  ai_confidence: number | null
  read_in_mcc: boolean
  dismissed: boolean
  raw_body_preview: string | null
}

export default function CommunicationsPage() {
  const [filter, setFilter] = useState<'all' | 'important'>('all')
  const [category, setCategory] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['emails', filter, category],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filter === 'important') params.set('important', 'true')
      if (category !== 'all') params.set('category', category)
      params.set('limit', '50')
      return fetch(`/api/gmail?${params}`).then((r) => r.json())
    },
  })

  const emails: EmailDigest[] = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#ededed]">Communications</h1>
          <p className="text-[#888] text-sm mt-1">AI-classified email digests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#ff9900]/10 text-[#ff9900]'
                : 'text-[#888] hover:text-[#ededed]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('important')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === 'important'
                ? 'bg-[#ff9900]/10 text-[#ff9900]'
                : 'text-[#888] hover:text-[#ededed]'
            }`}
          >
            Important
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3 h-3 text-[#888]" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#111] border border-[#222] rounded-lg px-3 py-1.5 text-xs text-[#ededed]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Email List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-[#888]">Loading emails...</div>
        ) : emails.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-[#333] mx-auto mb-3" />
            <p className="text-[#888]">No emails found</p>
          </div>
        ) : (
          <AnimatePresence>
            {emails.map((email) => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#111] border border-[#222] rounded-xl overflow-hidden hover:border-[#333] transition-colors"
              >
                <button
                  onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {email.is_important && (
                          <Star className="w-3 h-3 text-[#ff9900] fill-[#ff9900] flex-shrink-0" />
                        )}
                        {email.is_urgent && (
                          <AlertTriangle className="w-3 h-3 text-[#ef4444] flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-[#ededed] truncate">
                          {email.from_name || email.from_address}
                        </span>
                        {email.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#222] text-[#888] flex-shrink-0">
                            {email.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#ededed] truncate">{email.subject}</p>
                      {email.ai_summary && (
                        <p className="text-xs text-[#666] mt-1 truncate">{email.ai_summary}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-[#666] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
                      </span>
                      {expandedId === email.id ? (
                        <ChevronUp className="w-4 h-4 text-[#666]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#666]" />
                      )}
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedId === email.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-[#222] pt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[#888]">From:</span>{' '}
                            <span className="text-[#ededed]">
                              {email.from_name ? `${email.from_name} <${email.from_address}>` : email.from_address}
                            </span>
                          </div>
                          {email.ai_confidence != null && (
                            <div>
                              <span className="text-[#888]">AI Confidence:</span>{' '}
                              <span className="text-[#ededed]">
                                {Math.round(email.ai_confidence * 100)}%
                              </span>
                            </div>
                          )}
                        </div>

                        {email.ai_summary && (
                          <div>
                            <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">AI Summary</p>
                            <p className="text-sm text-[#ededed] bg-[#0a0a0a] rounded-lg p-3 border border-[#222]">
                              {email.ai_summary}
                            </p>
                          </div>
                        )}

                        {email.ai_action_items && email.ai_action_items !== 'none' && (
                          <div>
                            <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">Action Items</p>
                            <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222]">
                              {email.ai_action_items.split(',').map((item, i) => (
                                <p key={i} className="text-sm text-[#ff9900] flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-[#ff9900]" />
                                  {item.trim()}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {email.raw_body_preview && (
                          <div>
                            <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">Preview</p>
                            <p className="text-xs text-[#888] bg-[#0a0a0a] rounded-lg p-3 border border-[#222] whitespace-pre-wrap">
                              {email.raw_body_preview}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
