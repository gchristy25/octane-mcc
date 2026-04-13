import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const user = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '7', 10)

  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)

  const data = await prisma.calendarEvent.findMany({
    where: {
      start_time: {
        gte: now,
        lte: future,
      },
    },
    orderBy: { start_time: 'asc' },
  })

  return NextResponse.json({ data })
}
