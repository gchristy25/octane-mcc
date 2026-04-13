import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()

    const alert = await prisma.mccAlert.update({
      where: { id },
      data: {
        acknowledged: body.acknowledged ?? true,
      },
    })

    return NextResponse.json({ data: alert })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { error: 'Alert not found' },
      { status: 404 }
    )
  }
}
