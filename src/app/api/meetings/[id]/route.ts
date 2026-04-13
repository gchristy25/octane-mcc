import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        title: data.title,
        participants: data.participants,
        date: data.date ? new Date(data.date) : data.date,
        notes: data.notes,
      },
    })

    return NextResponse.json(meeting)
  } catch (error) {
    console.error('Meeting update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.meeting.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Meeting delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
