import { anthropic } from './client'

interface EmailInput {
  id: string
  from: string
  fromName: string
  subject: string
  snippet: string
  bodyPreview: string
}

interface EmailClassification {
  id: string
  is_important: boolean
  is_urgent: boolean
  category: string
  summary: string
  action_items: string
  confidence: number
}

export async function classifyEmails(
  emails: EmailInput[]
): Promise<EmailClassification[]> {
  if (emails.length === 0) return []

  const emailsText = emails
    .map(
      (e, i) =>
        `--- Email ${i + 1} (ID: ${e.id}) ---
From: ${e.fromName} <${e.from}>
Subject: ${e.subject}
Preview: ${e.bodyPreview || e.snippet}`
    )
    .join('\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: `You are an AI assistant for Galen Christy, CEO of Octane Multimedia, a film distribution and production company. Your job is to classify and summarize incoming emails.

Context about the business:
- Octane Multimedia handles film distribution, production financing, and investor relations
- Key contacts include investors, distributors, producers, talent agents, and legal counsel
- Time-sensitive items include deal deadlines, festival submissions, distribution windows, and investor communications
- The CEO needs to focus on strategic decisions, high-value relationships, and urgent business matters

For each email, provide a JSON classification with:
- is_important: boolean (true if relevant to business decisions, key relationships, or financials)
- is_urgent: boolean (true if requires action within 24 hours)
- category: one of "investor", "distribution", "production", "legal", "talent", "marketing", "operations", "personal", "spam", "newsletter"
- summary: 1-2 sentence summary of the email content and intent
- action_items: comma-separated list of actions needed, or "none"
- confidence: 0.0-1.0 confidence in classification

Respond with a JSON array of classifications, one per email, in the same order as provided.`,
    messages: [
      {
        role: 'user',
        content: `Classify these ${emails.length} emails:\n\n${emailsText}\n\nRespond with ONLY a JSON array, no markdown formatting.`,
      },
    ],
  })

  try {
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('Could not parse Claude response as JSON array')
      return emails.map((e) => ({
        id: e.id,
        is_important: false,
        is_urgent: false,
        category: 'operations',
        summary: e.snippet,
        action_items: 'none',
        confidence: 0,
      }))
    }

    const classifications = JSON.parse(jsonMatch[0]) as Array<{
      is_important?: boolean
      is_urgent?: boolean
      category?: string
      summary?: string
      action_items?: string
      confidence?: number
    }>

    return classifications.map((c, i) => ({
      id: emails[i].id,
      is_important: c.is_important ?? false,
      is_urgent: c.is_urgent ?? false,
      category: c.category || 'operations',
      summary: c.summary || '',
      action_items: c.action_items || 'none',
      confidence: c.confidence ?? 0.5,
    }))
  } catch (error) {
    console.error('Error parsing Claude classification:', error)
    return emails.map((e) => ({
      id: e.id,
      is_important: false,
      is_urgent: false,
      category: 'operations',
      summary: e.snippet,
      action_items: 'none',
      confidence: 0,
    }))
  }
}
