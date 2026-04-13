import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const investors = await prisma.mccInvestor.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(investors)
  } catch (error) {
    console.error('Investors list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const investor = await prisma.mccInvestor.create({
      data: {
        name: data.name,
        email: data.email,
        investments: data.investments,
        notes: data.notes,
        payment_status: data.payment_status,
      },
    })

    return NextResponse.json(investor, { status: 201 })
  } catch (error) {
    console.error('Investor create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
