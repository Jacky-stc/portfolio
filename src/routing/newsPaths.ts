import type { NewsLanguage } from '../data/techNews'

export function newsPath(language: NewsLanguage = 'zh-TW', slug?: string) {
  const prefix = language === 'en' ? 'en' : 'zh'
  return `/${prefix}/tech-news${slug ? `/${encodeURIComponent(slug)}` : ''}`
}

export function parseNewsPath(pathname: string): { language: NewsLanguage; slug?: string } | null {
  const match = pathname.replace(/\/+$/, '').match(/^\/(zh|en)\/tech-news(?:\/([^/]+))?$/)
  if (!match) return null
  try {
    return { language: match[1] === 'en' ? 'en' : 'zh-TW', slug: match[2] ? decodeURIComponent(match[2]) : undefined }
  } catch {
    return null
  }
}
