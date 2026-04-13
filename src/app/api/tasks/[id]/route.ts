import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.due_date !== undefined) updateData.due_date = body.due_date ? new Date(body.due_date) : null

    const task = await prisma.mccTask.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ data: task })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Task not found' },
      { status: 404 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    await prisma.mccTask.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Task not found' },
      { status: 404 }
    )
  }
}
