import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getAuthUrl } from '@/lib/google/oauth'

export async function GET() {
  const user = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = getAuthUrl()
  return NextResponse.redirect(url)
}
