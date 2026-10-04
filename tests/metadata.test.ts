import assert from 'node:assert/strict'
import test from 'node:test'
import { pageMetadata } from '../src/seo/metadata.ts'
import { SITE_URL } from '../src/seo/site.ts'
import { newsPath, parseNewsPath } from '../src/routing/newsPaths.ts'
import { techNews } from '../src/data/techNews.ts'

test('language paths preserve slugs and reject unsupported languages', () => {
  assert.equal(newsPath('en', 'welcome-to-tech-notes'), '/en/tech-news/welcome-to-tech-notes')
  assert.equal(newsPath(), '/zh/tech-news')
  assert.deepEqual(parseNewsPath('/zh/tech-news/'), { language: 'zh-TW', slug: undefined })
  assert.equal(parseNewsPath('/fr/tech-news'), null)
  assert.equal(parseNewsPath('/en/tech-news/%ZZ'), null)
  assert.equal(parseNewsPath('/en/tech-news/a/b'), null)
})

test('each translation self-canonicalizes and reciprocally links both languages', () => {
  const article = techNews.find((article) => !article.demo)
  assert.ok(article)
  const slug = article.slug
  const zh = pageMetadata(`/zh/tech-news/${slug}`, SITE_URL)
  const en = pageMetadata(`/en/tech-news/${slug}/`, SITE_URL)
  assert.notEqual(zh.title, en.title)
  assert.notEqual(zh.description, en.description)
  assert.equal(zh.canonical, `${SITE_URL}/zh/tech-news/${slug}`)
  assert.equal(en.canonical, `${SITE_URL}/en/tech-news/${slug}`)
  assert.deepEqual(zh.alternates, en.alternates)
  assert.deepEqual(
    en.alternates.map(({ language }) => language),
    ['zh-TW', 'en', 'x-default']
  )
  assert.equal(en.type, 'article')
  assert.equal(en.image, `${SITE_URL}/images/jacky-avatar.webp`)
  assert.equal(en.noindex, false, 'Published articles should be indexable')
})

test('home, lists and missing articles do not leak article metadata', () => {
  const home = pageMetadata('/', SITE_URL)
  assert.equal(home.language, 'en')
  assert.equal(home.canonical, `${SITE_URL}/`)
  assert.deepEqual(home.alternates, [])
  assert.equal(home.published, undefined)
  assert.equal(home.type, 'website')
  assert.equal(home.noindex, false)
  assert.equal(pageMetadata('/en/tech-news', SITE_URL).noindex, false)
  for (const path of [
    '/en/tech-news/missing',
    '/en/tech-news/welcome-to-tech-notes',
    '/zh/tech-news/welcome-to-tech-notes',
    '/unknown',
    '/fr/tech-news',
  ]) {
    const missing = pageMetadata(path, SITE_URL)
    assert.equal(missing.noindex, true)
    assert.equal(missing.canonical, undefined)
    assert.deepEqual(missing.alternates, [])
    assert.equal(missing.published, undefined)
  }
})
