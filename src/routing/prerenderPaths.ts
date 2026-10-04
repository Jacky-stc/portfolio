import { techNews } from '../data/techNews.ts'
import { newsPath } from './newsPaths.ts'

export const prerenderPaths = [
  '/',
  '/404',
  ...(['zh-TW', 'en'] as const).flatMap((language) => [newsPath(language), ...techNews.map(({ slug }) => newsPath(language, slug))]),
]
