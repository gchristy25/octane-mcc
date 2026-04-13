import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data.film_id || !data.territory) {
      return NextResponse.json(
        { error: 'film_id and territory are required' },
        { status: 400 }
      )
    }

    const deal = await prisma.deal.create({
      data: {
        film_id: data.film_id,
        territory: data.territory,
        buyer: data.buyer,
        status: data.status,
        amount: data.amount ? parseFloat(data.amount) : null,
        notes: data.notes,
      },
    })

    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    console.error('Deal create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
