import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getValidClient } from '@/lib/google/oauth'
import { fetchNewEmails } from '@/lib/google/gmail'
import { fetchUpcomingEvents } from '@/lib/google/calendar'
import { classifyEmails } from '@/lib/claude/email-classifier'
import { sendCliqNotification } from '@/lib/cliq/webhook'

export async function POST(request: Request) {
  const startTime = Date.now()

  // Verify cron secret (allow manual sync from authenticated users)
  const cronSecret = request.headers.get('x-cron-secret')
  const authHeader = request.headers.get('authorization')

  if (cronSecret !== process.env.CRON_SECRET && cronSecret !== 'manual-sync') {
    // Check if it's a Vercel cron call
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let emailsProcessed = 0
  let eventsProcessed = 0
  let alertsCreated = 0

  try {
    // 1. Get MccSession with Google tokens
    const session = await prisma.mccSession.findFirst({
      where: {
        google_access_token: { not: null },
        google_refresh_token: { not: null },
      },
    })

    if (!session) {
      await prisma.pollLog.create({
        data: {
          poll_type: 'full',
          status: 'skipped',
          error_message: 'No connected Google account found',
          duration_ms: Date.now() - startTime,
        },
      })
      return NextResponse.json({
        status: 'skipped',
        message: 'No Google account connected',
      })
    }

    // 2. Get valid OAuth client (refreshes tokens if needed)
    const auth = await getValidClient(session)

    // 3. Fetch new Gmail messages since last poll
    const lastPoll = await prisma.pollLog.findFirst({
      where: { status: 'success', poll_type: 'full' },
      orderBy: { createdAt: 'desc' },
    })

    const sinceDate = lastPoll?.createdAt || new Date(Date.now() - 24 * 60 * 60 * 1000)
    const newEmails = await fetchNewEmails(auth, sinceDate)

    // 4. Filter out already-stored emails
    const existingGmailIds = new Set(
      (
        await prisma.emailDigest.findMany({
          where: { gmail_id: { in: newEmails.map((e) => e.id) } },
          select: { gmail_id: true },
        })
      ).map((e) => e.gmail_id)
    )

    const freshEmails = newEmails.filter((e) => !existingGmailIds.has(e.id))

    // 5. Classify with Claude
    let classifications: Awaited<ReturnType<typeof classifyEmails>> = []
    if (freshEmails.length > 0) {
      classifications = await classifyEmails(freshEmails)
    }

    // 6. Store EmailDigest records
    for (let i = 0; i < freshEmails.length; i++) {
      const email = freshEmails[i]
      const classification = classifications[i]

      await prisma.emailDigest.create({
        data: {
          gmail_id: email.id,
          thread_id: email.threadId,
          from_address: email.from,
          from_name: email.fromName || null,
          subject: email.subject,
          snippet: email.snippet,
          received_at: new Date(email.date),
          is_important: classification?.is_important ?? false,
          is_urgent: classification?.is_urgent ?? false,
          category: classification?.category || null,
          ai_summary: classification?.summary || null,
          ai_action_items: classification?.action_items || null,
          ai_confidence: classification?.confidence ?? null,
          raw_body_preview: email.bodyPreview || null,
        },
      })
      emailsProcessed++
    }

    // 7. Fetch calendar events
    const upcomingEvents = await fetchUpcomingEvents(auth, 7)

    // 8. Store CalendarEvent records (upsert)
    for (const event of upcomingEvents) {
      await prisma.calendarEvent.upsert({
        where: { google_event_id: event.id },
        create: {
          google_event_id: event.id,
          title: event.title,
          description: event.description,
          start_time: new Date(event.startTime),
          end_time: new Date(event.endTime),
          location: event.location,
          meet_link: event.meetLink,
          attendees: event.attendees,
        },
        update: {
          title: event.title,
          description: event.description,
          start_time: new Date(event.startTime),
          end_time: new Date(event.endTime),
          location: event.location,
          meet_link: event.meetLink,
          attendees: event.attendees,
        },
      })
      eventsProcessed++
    }

    // 9. Generate MccAlert records for urgent items
    const urgentEmails = freshEmails.filter(
      (_e, i) => classifications[i]?.is_urgent
    )

    for (let i = 0; i < urgentEmails.length; i++) {
      const email = urgentEmails[i]
      const classification = classifications.find((c) => c.id === email.id)

      await prisma.mccAlert.create({
        data: {
          type: 'urgent_email',
          severity: 'warning',
          title: `Urgent: ${email.subject}`,
          message: classification?.summary || email.snippet,
          source_type: 'email',
          source_id: email.id,
        },
      })
      alertsCreated++
    }

    // 10. Push critical alerts to Cliq
    if (session.cliq_webhook_url && alertsCreated > 0) {
      const unsentAlerts = await prisma.mccAlert.findMany({
        where: { sent_to_cliq: false, severity: { in: ['critical', 'warning'] } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      for (const alert of unsentAlerts) {
        const sent = await sendCliqNotification(session.cliq_webhook_url, alert)
        if (sent) {
          await prisma.mccAlert.update({
            where: { id: alert.id },
            data: { sent_to_cliq: true, cliq_sent_at: new Date() },
          })
        }
      }
    }

    // 11. Log to PollLog
    await prisma.pollLog.create({
      data: {
        poll_type: 'full',
        status: 'success',
        emails_processed: emailsProcessed,
        events_processed: eventsProcessed,
        alerts_created: alertsCreated,
        duration_ms: Date.now() - startTime,
      },
    })

    return NextResponse.json({
      status: 'success',
      emails_processed: emailsProcessed,
      events_processed: eventsProcessed,
      alerts_created: alertsCreated,
      duration_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('Poll error:', error)

    await prisma.pollLog.create({
      data: {
        poll_type: 'full',
        status: 'error',
        emails_processed: emailsProcessed,
        events_processed: eventsProcessed,
        alerts_created: alertsCreated,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      },
    })

    return NextResponse.json(
      { error: 'Poll failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
