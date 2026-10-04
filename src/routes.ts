import { index, route } from '@react-router/dev/routes'

export default [
  index('pages/Home.tsx'),
  route('tech-news', 'pages/LegacyNewsRedirect.tsx', { id: 'legacy-news-list' }),
  route('tech-news/:slug', 'pages/LegacyNewsRedirect.tsx', { id: 'legacy-news-article' }),
  route('zh/tech-news', 'pages/TechNews.tsx', { id: 'news-zh-list' }),
  route('zh/tech-news/:slug', 'pages/TechNews.tsx', { id: 'news-zh-article' }),
  route('en/tech-news', 'pages/TechNews.tsx', { id: 'news-en-list' }),
  route('en/tech-news/:slug', 'pages/TechNews.tsx', { id: 'news-en-article' }),
  route('*', 'pages/TechNews.tsx', { id: 'not-found' }),
]
