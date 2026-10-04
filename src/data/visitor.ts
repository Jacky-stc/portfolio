let fallbackId: string | undefined

// A random daily browser ID, not a fingerprint or a natural-person identifier.
export function visitorId() {
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
  try {
    const stored = JSON.parse(localStorage.getItem('portfolio-visitor') || 'null')
    if (stored?.day === day && /^[a-f0-9-]{36}$/.test(stored.id)) return stored.id
    const id = crypto.randomUUID()
    localStorage.setItem('portfolio-visitor', JSON.stringify({ day, id }))
    return id
  } catch {
    fallbackId ||= crypto.randomUUID()
    return fallbackId
  }
}
