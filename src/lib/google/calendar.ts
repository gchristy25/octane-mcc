import { google, type Auth } from 'googleapis'

interface CalendarEventData {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  location: string | null
  meetLink: string | null
  attendees: string | null
}

export async function fetchUpcomingEvents(
  auth: Auth.OAuth2Client,
  days: number = 7
): Promise<CalendarEventData[]> {
  const calendar = google.calendar({ version: 'v3', auth })

  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    maxResults: 50,
    singleEvents: true,
    orderBy: 'startTime',
  })

  const events = response.data.items || []
  return events.map(parseEvent)
}

export function parseEvent(event: {
  id?: string | null
  summary?: string | null
  description?: string | null
  start?: { dateTime?: string | null; date?: string | null } | null
  end?: { dateTime?: string | null; date?: string | null } | null
  location?: string | null
  hangoutLink?: string | null
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string | null
      uri?: string | null
    }> | null
  } | null
  attendees?: Array<{
    email?: string | null
    displayName?: string | null
    responseStatus?: string | null
  }> | null
}): CalendarEventData {
  const meetLink =
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === 'video'
    )?.uri ||
    null

  const attendees = event.attendees
    ?.map((a) => a.displayName || a.email || '')
    .filter(Boolean)
    .join(', ') || null

  return {
    id: event.id || '',
    title: event.summary || 'Untitled Event',
    description: event.description || null,
    startTime: event.start?.dateTime || event.start?.date || '',
    endTime: event.end?.dateTime || event.end?.date || '',
    location: event.location || null,
    meetLink,
    attendees,
  }
}
