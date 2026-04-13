import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const film = await prisma.salesFilm.findUnique({
      where: { id },
      include: { deals: true },
    })

    if (!film) {
      return NextResponse.json({ error: 'Film not found' }, { status: 404 })
    }

    return NextResponse.json(film)
  } catch (error) {
    console.error('Sales get error:', error)
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

    const film = await prisma.salesFilm.update({
      where: { id },
      data: {
        title: data.title,
        genre: data.genre,
        status: data.status,
        territories: data.territories,
        buyers: data.buyers,
        last_contact_date: data.last_contact_date ? new Date(data.last_contact_date) : data.last_contact_date,
        notes: data.notes,
      },
      include: { deals: true },
    })

    return NextResponse.json(film)
  } catch (error) {
    console.error('Sales update error:', error)
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

    await prisma.salesFilm.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sales delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
