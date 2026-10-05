import { newsArticles } from './news/index.ts'

// Newest articles are displayed first. Dates are publication dates (YYYY-MM-DD).
// Distinguish the digest date from the original source publication dates.
export type NewsLanguage = 'en' | 'zh-TW'
export interface ArticleContent {
  title: string
  summary: string
  tags: string[]
  sections: { heading: string; paragraphs: string[] }[]
  sources: { label: string; url: string }[]
  imageAlt?: string
  imageCaption?: string
  socialImageAlt?: string
}
export interface NewsArticle extends ArticleContent {
  slug: string
  date: string
  demo?: boolean
  image?: string
  socialImage?: string
  translations: Record<'zh-TW', ArticleContent>
}

export const techNews: NewsArticle[] = [...newsArticles].sort((a, b) => b.date.localeCompare(a.date))

export function readingMinutes(article: Pick<ArticleContent, 'sections'>) {
  const text = article.sections.map(({ heading, paragraphs }) => [heading, ...paragraphs].join(' ')).join(' ')
  const cjkCharacters = (text.match(/[\u3400-\u9fff]/g) || []).length
  const words = text
    .replace(/[\u3400-\u9fff]/g, '')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200 + cjkCharacters / 400))
}

export function localizeArticle(article: NewsArticle, language: NewsLanguage): NewsArticle {
  return { ...article, ...(language === 'zh-TW' ? article.translations['zh-TW'] : {}) }
}

export function formatNewsDate(date: string, language: NewsLanguage = 'en') {
  return new Intl.DateTimeFormat(language, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`)
  )
}
