import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const user = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  const data = await prisma.mccAlert.findMany({
    orderBy: [
      { acknowledged: 'asc' },
      {
        severity: 'asc', // critical first when sorted
      },
      { createdAt: 'desc' },
    ],
    take: limit,
  })

  // Sort by severity priority manually since Prisma doesn't support custom sort
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 }
  data.sort((a, b) => {
    if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1
    const aSev = severityOrder[a.severity] ?? 3
    const bSev = severityOrder[b.severity] ?? 3
    if (aSev !== bSev) return aSev - bSev
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return NextResponse.json({ data })
}
