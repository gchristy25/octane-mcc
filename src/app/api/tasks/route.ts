import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: [
        { due_date: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Tasks list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        linked_entity_type: data.linked_entity_type,
        linked_entity_id: data.linked_entity_id,
        due_date: data.due_date ? new Date(data.due_date) : null,
        status: data.status,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Task create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
