import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTokensFromCode, getOAuthClient } from '@/lib/google/oauth'
import { google } from 'googleapis'

export async function GET(request: Request) {
  const user = await verifyAuth()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL('/settings?error=google_auth_denied', request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings?error=no_code', request.url)
    )
  }

  try {
    const tokens = await getTokensFromCode(code)

    // Get the user's email from Google
    const oauth2Client = getOAuthClient()
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()

    // Upsert MccSession
    await prisma.mccSession.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        google_access_token: tokens.access_token || null,
        google_refresh_token: tokens.refresh_token || null,
        google_token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
        google_email: userInfo.data.email || null,
      },
      update: {
        google_access_token: tokens.access_token || null,
        google_refresh_token: tokens.refresh_token || null,
        google_token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
        google_email: userInfo.data.email || null,
      },
    })

    return NextResponse.redirect(
      new URL('/settings?success=google_connected', request.url)
    )
  } catch (err) {
    console.error('Google callback error:', err)
    return NextResponse.redirect(
      new URL('/settings?error=google_token_exchange', request.url)
    )
  }
}
