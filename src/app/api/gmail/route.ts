import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const user = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const important = searchParams.get('important') === 'true'
  const category = searchParams.get('category')
  const dismissed = searchParams.get('dismissed') === 'true'
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (important) where.is_important = true
  if (category) where.category = category
  if (!dismissed) where.dismissed = false

  const [data, total] = await Promise.all([
    prisma.emailDigest.findMany({
      where,
      orderBy: { received_at: 'desc' },
      take: limit,
      skip,
    }),
    prisma.emailDigest.count({ where }),
  ])

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
