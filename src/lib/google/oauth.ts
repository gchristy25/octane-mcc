import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
]

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export function getAuthUrl() {
  const oauth2Client = getOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuthClient()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

export async function getValidClient(session: {
  id: string
  google_access_token: string | null
  google_refresh_token: string | null
  google_token_expiry: Date | null
}) {
  const oauth2Client = getOAuthClient()

  if (!session.google_access_token || !session.google_refresh_token) {
    throw new Error('Google account not connected')
  }

  oauth2Client.setCredentials({
    access_token: session.google_access_token,
    refresh_token: session.google_refresh_token,
  })

  // Check if token is expired or will expire in next 5 minutes
  const expiryTime = session.google_token_expiry?.getTime() || 0
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  if (expiryTime - now < fiveMinutes) {
    const newCredentials = await refreshAccessToken(session.google_refresh_token)

    await prisma.mccSession.update({
      where: { id: session.id },
      data: {
        google_access_token: newCredentials.access_token,
        google_token_expiry: newCredentials.expiry_date
          ? new Date(newCredentials.expiry_date)
          : null,
      },
    })

    oauth2Client.setCredentials(newCredentials)
  }

  return oauth2Client
}
