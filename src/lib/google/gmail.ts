import { google, type Auth } from 'googleapis'

interface EmailMessage {
  id: string
  threadId: string
  from: string
  fromName: string
  subject: string
  snippet: string
  date: string
  bodyPreview: string
}

export async function fetchNewEmails(
  auth: Auth.OAuth2Client,
  sinceDate: Date
): Promise<EmailMessage[]> {
  const gmail = google.gmail({ version: 'v1', auth })

  const afterTimestamp = Math.floor(sinceDate.getTime() / 1000)
  const query = `after:${afterTimestamp}`

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 50,
  })

  const messages = listResponse.data.messages || []
  const emails: EmailMessage[] = []

  for (const msg of messages) {
    if (!msg.id) continue

    try {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      })

      const parsed = parseEmailHeaders(detail.data)
      emails.push(parsed)
    } catch (error) {
      console.error(`Error fetching email ${msg.id}:`, error)
    }
  }

  return emails
}

export function parseEmailHeaders(message: {
  id?: string | null
  threadId?: string | null
  snippet?: string | null
  payload?: {
    headers?: Array<{ name?: string | null; value?: string | null }> | null
    body?: { data?: string | null } | null
  } | null
}): EmailMessage {
  const headers = message.payload?.headers || []

  const getHeader = (name: string): string => {
    const header = headers.find(
      (h) => h.name?.toLowerCase() === name.toLowerCase()
    )
    return header?.value || ''
  }

  const fromFull = getHeader('From')
  const fromMatch = fromFull.match(/^"?([^"<]*)"?\s*<?([^>]*)>?$/)
  const fromName = fromMatch?.[1]?.trim() || ''
  const fromAddress = fromMatch?.[2]?.trim() || fromFull

  // Get body preview from snippet
  const bodyPreview = message.snippet || ''

  return {
    id: message.id || '',
    threadId: message.threadId || '',
    from: fromAddress,
    fromName: fromName,
    subject: getHeader('Subject'),
    snippet: message.snippet || '',
    date: getHeader('Date'),
    bodyPreview: bodyPreview.substring(0, 500),
  }
}
