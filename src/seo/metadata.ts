import { localizeArticle, techNews } from '../data/techNews.ts'
import { newsPath, parseNewsPath } from '../routing/newsPaths.ts'

export function pageMetadata(pathname: string, siteUrl?: string) {
  const route = parseNewsPath(pathname)
  const baseArticle = route?.slug ? techNews.find(({ slug }) => slug === route.slug) : null
  const article = baseArticle && route ? localizeArticle(baseArticle, route.language) : undefined
  const home = pathname === '/'
  const found = home || (route && (!route.slug || article))
  const language = route?.language || 'en'
  const chinese = language === 'zh-TW'
  let origin: string | undefined
  if (siteUrl) {
    const url = new URL(siteUrl)
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('VITE_SITE_URL must be an HTTP(S) URL')
    origin = url.origin
  }
  const absolute = (path: string) => (origin ? new URL(path, origin).href : undefined)
  const canonical = found ? absolute(home ? '/' : newsPath(language, route?.slug)) : undefined
  const title = !found
    ? chinese
      ? '找不到頁面 | Jacky Su'
      : 'Page not found | Jacky Su'
    : article
      ? `${article.title} | Jacky Su`
      : home
        ? 'Jacky Su | Frontend Developer'
        : chinese
          ? '前端與 AI 科技新聞 | Jacky Su'
          : 'Frontend & AI Tech News | Jacky Su'
  const description = !found
    ? chinese
      ? '這個頁面不存在，請返回新聞列表。'
      : 'This page is not available. Return to the news journal.'
    : article?.summary ||
      (home
        ? "Explore Jacky Su's frontend development portfolio, featuring React and Next.js projects, professional experience, and interactive web experiences."
        : chinese
          ? '閱讀前端與 AI 科技新聞，包含重點摘要、技術觀點與原始資料來源。'
          : 'Explore frontend and AI news with concise summaries, technical perspectives, and original sources.')
  const alternates =
    found && route && origin
      ? [
          { language: 'zh-TW', href: absolute(newsPath('zh-TW', route.slug)) },
          { language: 'en', href: absolute(newsPath('en', route.slug)) },
          { language: 'x-default', href: absolute(newsPath('zh-TW', route.slug)) },
        ]
      : []
  // SVG is not reliably accepted as a social preview image; use the supplied raster avatar as fallback.
  const image = absolute(
    article?.socialImage || (article?.image && !article.image.endsWith('.svg') ? article.image : '/images/jacky-avatar.webp')
  )
  return {
    title,
    description,
    language,
    canonical,
    alternates,
    image,
    imageAlt: article?.socialImageAlt || (article?.image && !article.image.endsWith('.svg') ? article.imageAlt : 'Jacky Su'),
    type: article ? 'article' : 'website',
    published: article?.date,
    noindex: !found || !!article?.demo,
    found: !!found,
  }
}
