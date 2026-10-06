import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { formatNewsDate, localizeArticle, readingMinutes, techNews } from '../src/data/techNews.ts'

test('daily JSON files match the catalog and contain both languages', () => {
  const directory = new URL('../src/data/news/', import.meta.url)
  const files = readdirSync(directory).filter((file) => file.endsWith('.json'))
  assert.equal(files.length, techNews.length, 'Generated index must include every daily JSON')
  assert.equal(new Set(techNews.map(({ date }) => date)).size, techNews.length)
  for (const file of files) {
    const article = JSON.parse(readFileSync(new URL(file, directory), 'utf8'))
    assert.equal(file, `${article.date}.json`)
    assert.ok(article.title && article.translations?.['zh-TW']?.title)
    assert.deepEqual(
      techNews.find(({ slug }) => slug === article.slug),
      article
    )
  }
  assert.deepEqual(
    techNews.map(({ date }) => date),
    techNews
      .map(({ date }) => date)
      .sort()
      .reverse()
  )
})

test('articles have unique routes, valid dates, images and complete translations', () => {
  assert.equal(new Set(techNews.map(({ slug }) => slug)).size, techNews.length)
  const publishedArticles = techNews.filter(({ demo }) => !demo)
  assert.equal(
    new Set(publishedArticles.map(({ image }) => image)).size,
    publishedArticles.length,
    'Each published article needs its own cover'
  )
  for (const article of techNews) {
    assert.match(article.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    assert.match(article.date, /^\d{4}-\d{2}-\d{2}$/)
    assert.equal(new Date(`${article.date}T00:00:00Z`).toISOString().slice(0, 10), article.date)
    assert.ok(article.translations?.['zh-TW'])
    if (!article.demo) assert.match(article.image ?? '', /^\/images\/.+\.svg$/)
    if (article.image?.startsWith('/')) assert.ok(existsSync(new URL(`../public${article.image}`, import.meta.url)))
    for (const language of ['en', 'zh-TW'] as const) {
      const localized = localizeArticle(article, language)
      assert.ok(localized.title && localized.summary && localized.sections.length && localized.tags.length)
      assert.equal(localized.slug, article.slug)
      assert.equal(localized.date, article.date)
      for (const section of localized.sections) assert.ok(section.heading && section.paragraphs.length && section.paragraphs.every(Boolean))
      if (localized.image) assert.ok(localized.imageAlt && localized.imageCaption)
      if (!article.demo) assert.ok(localized.sources.length, 'Real news must cite primary sources')
      for (const source of localized.sources) {
        assert.ok(source.label)
        assert.equal(new URL(source.url).protocol, 'https:')
      }
      assert.ok(readingMinutes(localized) >= 1)
      assert.ok(formatNewsDate(article.date, language))
    }
  }
})

test('reading time supports English and Chinese', () => {
  const article = (text: string) => ({ sections: [{ heading: '', paragraphs: [text] }] })
  assert.equal(readingMinutes(article('word '.repeat(401))), 3)
  assert.equal(readingMinutes(article('字'.repeat(801))), 3)
  assert.equal(readingMinutes(article('')), 1)
})
