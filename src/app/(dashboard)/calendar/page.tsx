'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Video, Users, Clock, FileText } from 'lucide-react'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'

interface CalendarEventItem {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  location: string | null
  meet_link: string | null
  attendees: string | null
  is_important: boolean
  ai_prep_notes: string | null
}

export default function CalendarPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['calendar', 'upcoming', 14],
    queryFn: () => fetch('/api/calendar?days=14').then((r) => r.json()),
  })

  const events: CalendarEventItem[] = data?.data || []

  // Group events by date
  const groupedEvents: Record<string, CalendarEventItem[]> = {}
  events.forEach((event) => {
    const dateKey = format(parseISO(event.start_time), 'yyyy-MM-dd')
    if (!groupedEvents[dateKey]) groupedEvents[dateKey] = []
    groupedEvents[dateKey].push(event)
  })

  const sortedDates = Object.keys(groupedEvents).sort()

  function getDateLabel(dateStr: string): string {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEEE, MMMM d')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#ededed]">Calendar</h1>
        <p className="text-[#888] text-sm mt-1">Upcoming events - next 14 days</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[#888]">Loading events...</div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-[#333] mx-auto mb-3" />
          <p className="text-[#888]">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((dateStr) => (
            <div key={dateStr}>
              <h2 className="text-sm font-semibold text-[#ff9900] mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {getDateLabel(dateStr)}
              </h2>
              <div className="space-y-3">
                {groupedEvents[dateStr].map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#111] border border-[#222] rounded-xl p-5 hover:border-[#333] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-[#ededed]">{event.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[#888]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(parseISO(event.start_time), 'h:mm a')} -{' '}
                            {format(parseISO(event.end_time), 'h:mm a')}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                          {event.attendees && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {event.attendees.split(',').length} attendees
                            </span>
                          )}
                        </div>
                      </div>
                      {event.meet_link && (
                        <a
                          href={event.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 rounded-lg text-xs hover:bg-[#22c55e]/20 transition-colors"
                        >
                          <Video className="w-3 h-3" />
                          Join
                        </a>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-xs text-[#666] mt-3 border-t border-[#222] pt-3">
                        {event.description.substring(0, 200)}
                        {event.description.length > 200 ? '...' : ''}
                      </p>
                    )}

                    {event.ai_prep_notes && (
                      <div className="mt-3 border-t border-[#222] pt-3">
                        <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          AI Prep Notes
                        </p>
                        <p className="text-xs text-[#ff9900] bg-[#ff9900]/5 rounded-lg p-3 border border-[#ff9900]/10">
                          {event.ai_prep_notes}
                        </p>
                      </div>
                    )}

                    {event.attendees && (
                      <div className="mt-3 border-t border-[#222] pt-3">
                        <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">
                          Attendees
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {event.attendees.split(',').map((attendee, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-[#222] text-[#888]"
                            >
                              {attendee.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
