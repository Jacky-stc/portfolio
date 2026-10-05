import october4 from './2026-10-04.json'
import october5 from './2026-10-05.json'
import type { NewsArticle } from '../techNews'

// Register each daily JSON here so browser, SSG, and API builds share one catalog.
export const newsArticles: NewsArticle[] = [october4, october5]
