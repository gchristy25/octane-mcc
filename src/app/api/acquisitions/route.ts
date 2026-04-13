import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const acquisitions = await prisma.acquisition.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(acquisitions)
  } catch (error) {
    console.error('Acquisitions list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const acquisition = await prisma.acquisition.create({
      data: {
        title: data.title,
        synopsis: data.synopsis,
        cast: data.cast,
        budget: data.budget ? parseFloat(data.budget) : null,
        status: data.status,
        notes: data.notes,
      },
    })

    return NextResponse.json(acquisition, { status: 201 })
  } catch (error) {
    console.error('Acquisition create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
