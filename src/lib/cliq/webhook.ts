interface CliqAlert {
  type: string
  severity: string
  title: string
  message: string
}

export async function sendCliqNotification(
  webhookUrl: string,
  alert: CliqAlert
): Promise<boolean> {
  try {
    const severityEmoji =
      alert.severity === 'critical'
        ? '🔴'
        : alert.severity === 'warning'
          ? '🟡'
          : '🔵'

    const payload = {
      text: `${severityEmoji} *${alert.title}*\n${alert.message}\n_Type: ${alert.type} | Severity: ${alert.severity}_`,
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    return response.ok
  } catch (error) {
    console.error('Error sending Cliq notification:', error)
    return false
  }
}
