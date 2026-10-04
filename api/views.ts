import { createHmac } from 'node:crypto'
import type { IncomingHttpHeaders } from 'node:http'
import { techNews } from '../src/data/techNews.ts'

const slugs = new Set(techNews.filter(({ demo }) => !demo).map(({ slug }) => slug))
export interface CounterRequest {
  method?: string
  query?: Record<string, string | string[] | undefined>
  headers: IncomingHttpHeaders
  body?: unknown
  socket?: { remoteAddress?: string }
}
export type CounterResult = { count: number; error?: never } | { error: string; count?: never }
export interface CounterResponse {
  setHeader(name: string, value: string): unknown
  status(code: number): CounterResponse
  json(body: CounterResult): unknown
}
const increment = `
local requests = redis.call('INCR', KEYS[3])
if requests == 1 then redis.call('EXPIRE', KEYS[3], 3600) end
if requests > 120 then return -1 end
if redis.call('SET', KEYS[2], '1', 'NX', 'EX', 172800) then
  return redis.call('INCR', KEYS[1])
end
return tonumber(redis.call('GET', KEYS[1]) or '0')
`

export default async function handler(req: CounterRequest, res: CounterResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (!req.method || !['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const slug = req.query?.slug
  if (slug !== undefined && (typeof slug !== 'string' || !slugs.has(slug))) {
    return res.status(404).json({ error: 'Article not found' })
  }
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return res.status(503).json({ error: 'Counter not configured' })
  const key = `portfolio:views:${slug || 'site'}`
  let command: (string | number)[] = ['GET', key]

  if (req.method === 'POST') {
    // Reject browser cross-origin writes; no permissive CORS headers are sent.
    const origin = req.headers.origin
    if (
      req.headers['sec-fetch-site'] === 'cross-site' ||
      (origin && ![process.env.SITE_URL || 'https://www.jackysu.dev', `https://${process.env.VERCEL_URL}`].includes(origin))
    ) {
      return res.status(403).json({ error: 'Origin not allowed' })
    }
    if (!req.headers['content-type']?.startsWith('application/json')) {
      return res.status(415).json({ error: 'JSON required' })
    }
    let body: unknown
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    } catch {
      /* Invalid JSON below */
    }
    const visitorId = body && typeof body === 'object' && 'visitorId' in body ? body.visitorId : undefined
    if (typeof visitorId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(visitorId)) {
      return res.status(400).json({ error: 'Invalid visitor ID' })
    }
    const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
    const ip = req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
    const hash = (value: string) => createHmac('sha256', token).update(value).digest('hex')
    command = ['EVAL', increment, 3, key, `${key}:seen:${date}:${hash(visitorId)}`, `portfolio:rate:${hash(`${date}:${ip}`)}`]
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error('Storage unavailable')
    const data = await response.json()
    if (data.error) throw new Error('Storage command failed')
    const count = Number(data.result ?? 0)
    if (count === -1) return res.status(429).json({ error: 'Too many requests' })
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid stored count')
    return res.status(200).json({ count })
  } catch {
    return res.status(503).json({ error: 'Counter unavailable' })
  }
}
