import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        territory: data.territory,
        buyer: data.buyer,
        status: data.status,
        amount: data.amount !== undefined ? parseFloat(data.amount) : undefined,
        notes: data.notes,
      },
    })

    return NextResponse.json(deal)
  } catch (error) {
    console.error('Deal update error:', error)
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

    await prisma.deal.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Deal delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
