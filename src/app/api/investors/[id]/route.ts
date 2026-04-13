import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const investor = await prisma.mccInvestor.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        investments: data.investments,
        notes: data.notes,
        payment_status: data.payment_status,
      },
    })

    return NextResponse.json(investor)
  } catch (error) {
    console.error('Investor update error:', error)
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

    await prisma.mccInvestor.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Investor delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
