import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const [recentDeals, pendingTasks, upcomingMeetings, staleFilms, overdueTasks, newAcquisitions] =
      await Promise.all([
        prisma.deal.findMany({
          take: 5,
          orderBy: { updatedAt: 'desc' },
          include: { film: true },
        }),

        prisma.task.findMany({
          where: { status: { not: 'done' } },
          take: 10,
          orderBy: [
            { due_date: { sort: 'asc', nulls: 'last' } },
            { createdAt: 'desc' },
          ],
        }),

        prisma.meeting.findMany({
          where: { date: { gte: now } },
          take: 5,
          orderBy: { date: 'asc' },
        }),

        prisma.salesFilm.count({
          where: {
            last_contact_date: {
              lt: fourteenDaysAgo,
            },
          },
        }),

        prisma.task.count({
          where: {
            due_date: { lt: now },
            status: { not: 'done' },
          },
        }),

        prisma.acquisition.count({
          where: { status: 'new' },
        }),
      ])

    const alerts: string[] = []

    if (staleFilms > 0) {
      alerts.push(`${staleFilms} deal${staleFilms === 1 ? '' : 's'} need follow-up`)
    }
    if (overdueTasks > 0) {
      alerts.push(`${overdueTasks} task${overdueTasks === 1 ? '' : 's'} overdue`)
    }
    if (newAcquisitions > 0) {
      alerts.push(`${newAcquisitions} acquisition${newAcquisitions === 1 ? '' : 's'} pending review`)
    }

    return NextResponse.json({
      recentDeals,
      pendingTasks,
      upcomingMeetings,
      alerts,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
