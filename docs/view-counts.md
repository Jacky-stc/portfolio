# View counts

The UI reads `/api/views`; article pages POST with `?slug=...` while list cards only GET. The shared footer POSTs once when the app mounts. Counts load after hydration, so SSG never records visits. `—` means loading or unavailable, not zero.

Counts are cumulative daily browser visits, not unique natural people. One browser counts once per Taiwan calendar day for the site and once for each article; Chinese and English share the same slug. A random daily ID is kept in localStorage. Redis stores HMAC-derived deduplication keys for two days; no raw IP or browser ID is persisted by this code. The service provider may retain its own request logs. Private browsing, clearing storage, different devices, and bots affect totals.

## Production setup required

Create and connect an Upstash Redis database to this Vercel project, then configure server-only environment variables:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN` (read/write token)
- `SITE_URL` only if the canonical host differs from `https://www.jackysu.dev`

Never prefix these secrets with `VITE_` or put them in frontend source. Redeploy after configuration. No database has been provisioned by this change. See [Upstash REST documentation](https://upstash.com/docs/redis/features/restapi) and [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js).

The static site remains in `build/client`; Vercel deploys `api/views.ts` as a separate function. `pnpm dev` and `pnpm preview` only serve the site and do not emulate that function. For end-to-end testing, use a Vercel preview deployment with a separate test database. A static-only host cannot persist these counts.

Redis Lua atomically deduplicates and increments. POSTs are limited to 120 requests per IP-derived key per hour; this is basic abuse protection, not fraud-proof analytics. Configure Vercel Firewall rate limits for `/api/views` before exposing the endpoint to heavy traffic (GET requests also cost database reads). Use a separate Redis database for preview environments to avoid polluting production counts.

Verify on deployment: open the site and an article, reload, switch language, and confirm same-day counts stay unchanged; a second browser should increment them. Confirm lists never increment article counts and unavailable storage displays `—`. Historical visits cannot be reconstructed; totals start when the service is configured.
