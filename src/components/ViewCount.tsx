import { Eye, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { parseNewsPath } from '../routing/newsPaths'
import { visitorId } from '../data/visitor'

import type { NewsLanguage } from '../data/techNews'

export default function ViewCount({ slug, language, track = false }: { slug?: string; language?: NewsLanguage; track?: boolean }) {
  const { pathname } = useLocation()
  const locale = language || parseNewsPath(pathname)?.language || 'en'
  const chinese = locale === 'zh-TW'
  const [count, setCount] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    setCount(null)
    setFailed(false)
    fetch(`/api/views${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`, {
      method: track ? 'POST' : 'GET',
      credentials: 'same-origin',
      headers: track ? { 'Content-Type': 'application/json' } : undefined,
      body: track ? JSON.stringify({ visitorId: visitorId() }) : undefined,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Counter unavailable')
        const data = await response.json()
        if (!Number.isSafeInteger(data.count) || data.count < 0) throw new Error('Invalid count')
        if (active) setCount(data.count)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [slug, track])

  const Icon = slug ? Eye : Users
  const label = slug ? (chinese ? '文章閱覽' : 'Article views') : chinese ? '網站訪客' : 'Site visitors'
  const explanation = chinese ? '同一瀏覽器每日計一次，累計值' : 'Cumulative total; one count per browser per day'
  const status = failed ? (chinese ? '計數暫時無法取得' : 'Count unavailable') : chinese ? '載入中' : 'Loading'
  return (
    <span
      className="view-count"
      title={`${label} · ${explanation}`}
      aria-label={`${label}: ${count === null ? status : count}`}
    >
      <Icon aria-hidden="true" />
      <span>{count === null ? '—' : new Intl.NumberFormat(locale).format(count)}</span>
    </span>
  )
}
