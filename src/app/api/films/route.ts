import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await verifyAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const films = await prisma.film.findMany({
    include: { slate: true },
    orderBy: { createdAt: 'desc' },
  })

  const stats = {
    total: films.length,
    development: films.filter((f) => f.status === 'development').length,
    inProduction: films.filter((f) => f.status === 'production' || f.status === 'in_production').length,
    postProduction: films.filter((f) => f.status === 'post_production').length,
    released: films.filter((f) => f.status === 'released' || f.status === 'distributed').length,
  }

  const totalBudget = films.reduce((sum, f) => sum + (f.budget || 0), 0)
  const totalRevenue = films.reduce((sum, f) => sum + (f.total_revenue || 0), 0)

  return NextResponse.json({
    data: films,
    stats,
    totalBudget,
    totalRevenue,
  })
}
