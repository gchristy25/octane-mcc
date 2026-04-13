import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const user = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const data = await prisma.mccTask.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: limit,
  })

  // Sort by priority manually
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  data.sort((a, b) => {
    const statusOrder: Record<string, number> = { pending: 0, in_progress: 1, completed: 2 }
    const aStatus = statusOrder[a.status] ?? 3
    const bStatus = statusOrder[b.status] ?? 3
    if (aStatus !== bStatus) return aStatus - bStatus
    const aPri = priorityOrder[a.priority] ?? 3
    const bPri = priorityOrder[b.priority] ?? 3
    return aPri - bPri
  })

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const user = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const task = await prisma.mccTask.create({
      data: {
        title: body.title,
        description: body.description || null,
        status: body.status || 'pending',
        priority: body.priority || 'medium',
        due_date: body.due_date ? new Date(body.due_date) : null,
        source_type: body.source_type || null,
        source_id: body.source_id || null,
      },
    })

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
