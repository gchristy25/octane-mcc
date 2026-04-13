import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPTS: Record<string, string> = {
  prep_meeting: `You are a strategic advisor for Octane Multimedia, a film sales and production company. Given meeting notes and participants, generate:
1. Key talking points for the meeting
2. Potential risks or sensitive topics to be aware of
3. Recommended strategy and approach
Keep the tone professional and concise. Focus on actionable insights for film industry meetings.`,

  draft_followup: `You are a professional communications specialist for Octane Multimedia, a film sales and production company. Draft a polished follow-up email to a buyer after a film sales meeting. The email should be:
- Professional but warm
- Reference specific details about the film discussed
- Include a clear next step or call to action
- Maintain the relationship-building tone typical of international film sales`,

  analyze_deal: `You are a deal analyst for Octane Multimedia, a film sales and production company. Analyze the provided deal information and deliver:
1. Strengths of the deal
2. Risks and red flags
3. Recommended next move
Be direct, data-oriented, and focused on maximizing value for Octane Multimedia.`,

  evaluate_acquisition: `You are an acquisitions advisor for Octane Multimedia, a film sales and production company that acquires and distributes independent films. Based on the synopsis, cast, and other details provided, deliver:
1. A clear BUY or PASS recommendation
2. Market potential analysis
3. Target audience assessment
4. Comparable titles and their performance
5. Key risks
Be candid and commercially focused.`,

  investor_update: `You are a communications specialist for Octane Multimedia, a film sales and production company. Draft a polished investor update email based on the provided notes. The email should:
- Be professional and confident
- Highlight progress and wins
- Address challenges transparently but positively
- Include forward-looking statements
- Maintain investor confidence`,
}

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json()

    if (!action || !data) {
      return NextResponse.json(
        { error: 'action and data are required' },
        { status: 400 }
      )
    }

    const systemPrompt = SYSTEM_PROMPTS[action]

    if (!systemPrompt) {
      return NextResponse.json(
        { error: `Unknown action: ${action}. Valid actions: ${Object.keys(SYSTEM_PROMPTS).join(', ')}` },
        { status: 400 }
      )
    }

    let userMessage = ''

    switch (action) {
      case 'prep_meeting':
        userMessage = `Meeting Notes: ${data.notes || 'N/A'}\nParticipants: ${data.participants || 'N/A'}`
        break
      case 'draft_followup':
        userMessage = `Film Title: ${data.title || 'N/A'}\nMeeting Notes: ${data.notes || 'N/A'}`
        break
      case 'analyze_deal':
        userMessage = `Deal Notes: ${data.notes || 'N/A'}`
        break
      case 'evaluate_acquisition':
        userMessage = `Synopsis: ${data.synopsis || 'N/A'}\nCast: ${data.cast || 'N/A'}`
        break
      case 'investor_update':
        userMessage = `Notes: ${data.notes || 'N/A'}`
        break
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const result = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    return NextResponse.json({ result })
  } catch (error) {
    console.error('AI route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
