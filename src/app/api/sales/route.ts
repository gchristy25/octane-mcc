import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const films = await prisma.salesFilm.findMany({
      include: { deals: true },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(films)
  } catch (error) {
    console.error('Sales list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const film = await prisma.salesFilm.create({
      data: {
        title: data.title,
        genre: data.genre,
        status: data.status,
        territories: data.territories,
        buyers: data.buyers,
        last_contact_date: data.last_contact_date ? new Date(data.last_contact_date) : null,
        notes: data.notes,
      },
      include: { deals: true },
    })

    return NextResponse.json(film, { status: 201 })
  } catch (error) {
    console.error('Sales create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
