import assert from 'node:assert/strict'
import test from 'node:test'
import handler from '../api/views.ts'
import { techNews } from '../src/data/techNews.ts'
import type { CounterRequest, CounterResponse, CounterResult } from '../api/views.ts'

interface MockResponse extends CounterResponse {
  headers: Record<string, string>
  code?: number
  body: Partial<CounterResult>
  status(code: number): MockResponse
  json(body: CounterResult): MockResponse
}

function response(): MockResponse {
  return {
    headers: {},
    body: {},
    setHeader(key, value) {
      this.headers[key] = value
    },
    status(code) {
      this.code = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}
test('counter validates requests and handles missing storage without fake counts', async () => {
  const cases: [CounterRequest, number][] = [
    [{ method: 'DELETE', headers: {} }, 405],
    [{ method: 'GET', query: { slug: 'missing' }, headers: {} }, 404],
  ]
  for (const [req, status] of cases) {
    const res = response()
    await handler(req, res)
    assert.equal(res.code, status)
    assert.equal(res.body.count, undefined)
  }
})

test('reads do not increment; writes deduplicate per slug and day and hide storage errors', async (t) => {
  const keys = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'SITE_URL']
  const previous = keys.map((key) => process.env[key])
  t.after(() =>
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key]
      else process.env[key] = previous[index]
    })
  )
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test'
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
  process.env.SITE_URL = 'https://www.jackysu.dev'
  let command: (string | number)[] = []
  let result: string | number = '42'
  t.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, options?: RequestInit) => {
    command = JSON.parse(String(options?.body))
    return Response.json({ result })
  })
  const req: CounterRequest = { method: 'GET', query: { slug: techNews[0].slug }, headers: {} }
  let res = response()
  await handler(req, res)
  assert.equal(res.body.count, 42)
  assert.equal(command[0], 'GET')
  req.method = 'POST'
  req.headers = { origin: 'https://www.jackysu.dev', 'content-type': 'application/json' }
  const visitorId = '12345678-1234-4123-8123-123456789abc'
  req.body = { visitorId }
  res = response()
  await handler(req, res)
  assert.equal(res.code, 200)
  assert.equal(command[0], 'EVAL')
  assert.match(String(command[1]), /'NX'/)
  assert.match(String(command[1]), /'INCR', KEYS\[1\]/)
  assert.ok(!command.join(' ').includes(visitorId))
  const dedupKey = command[4]
  await handler(req, response())
  assert.equal(command[4], dedupKey)
  req.headers.origin = 'https://other.example'
  res = response()
  await handler(req, res)
  assert.equal(res.code, 403)
  req.headers.origin = 'https://www.jackysu.dev'
  result = -1
  res = response()
  await handler(req, res)
  assert.equal(res.code, 429)
  result = 'bad'
  res = response()
  await handler(req, res)
  assert.equal(res.code, 503)
  process.env.UPSTASH_REDIS_REST_TOKEN = ''
  res = response()
  await handler(req, res)
  assert.equal(res.code, 503)
})
