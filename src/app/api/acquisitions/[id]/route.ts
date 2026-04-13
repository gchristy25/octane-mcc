import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const acquisition = await prisma.acquisition.findUnique({
      where: { id },
    })

    if (!acquisition) {
      return NextResponse.json(
        { error: 'Acquisition not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(acquisition)
  } catch (error) {
    console.error('Acquisition get error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const acquisition = await prisma.acquisition.update({
      where: { id },
      data: {
        title: data.title,
        synopsis: data.synopsis,
        cast: data.cast,
        budget: data.budget !== undefined ? parseFloat(data.budget) : undefined,
        status: data.status,
        notes: data.notes,
      },
    })

    return NextResponse.json(acquisition)
  } catch (error) {
    console.error('Acquisition update error:', error)
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

    await prisma.acquisition.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Acquisition delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
