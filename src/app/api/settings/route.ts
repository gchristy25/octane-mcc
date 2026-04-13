import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = await prisma.mccSession.findUnique({
    where: { user_id: user.id },
  })

  const lastPoll = await prisma.pollLog.findFirst({
    orderBy: { createdAt: 'desc' },
  })

  const recentPolls = await prisma.pollLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return NextResponse.json({
    google_email: session?.google_email || null,
    google_connected: !!session?.google_access_token,
    cliq_webhook_url: session?.cliq_webhook_url || null,
    last_poll: lastPoll?.createdAt || null,
    last_poll_status: lastPoll?.status || null,
    recent_polls: recentPolls,
  })
}

export async function PUT(request: Request) {
  const user = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const session = await prisma.mccSession.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        cliq_webhook_url: body.cliq_webhook_url || null,
      },
      update: {
        cliq_webhook_url: body.cliq_webhook_url || null,
      },
    })

    return NextResponse.json({
      cliq_webhook_url: session.cliq_webhook_url,
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
