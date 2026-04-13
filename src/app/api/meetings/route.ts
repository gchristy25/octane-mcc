import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const meetings = await prisma.meeting.findMany({
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error('Meetings list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        participants: data.participants,
        date: data.date ? new Date(data.date) : null,
        notes: data.notes,
      },
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error('Meeting create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
