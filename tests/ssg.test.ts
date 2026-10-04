import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'
import { prerenderPaths } from '../src/routing/prerenderPaths.ts'
import { pageMetadata } from '../src/seo/metadata.ts'
import { SITE_URL } from '../src/seo/site.ts'
import { localizeArticle, techNews } from '../src/data/techNews.ts'
import { parseNewsPath } from '../src/routing/newsPaths.ts'

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')

for (const path of prerenderPaths) {
  test(`static HTML contains content and metadata without JavaScript: ${path}`, async () => {
    const html = await readFile(`build/client${path === '/' ? '' : path}/index.html`, 'utf8')
    const meta = pageMetadata(path, SITE_URL)
    const head = html.slice(0, html.indexOf('</head>'))
    assert.ok(head.includes(`<title>${escape(meta.title)}</title>`))
    assert.equal((head.match(/<title>/g) || []).length, 1)
    assert.ok(head.includes(`content="${escape(meta.description)}"`))
    assert.ok(html.includes(`<html lang="${meta.language}"`))
    if (meta.canonical) assert.ok(head.includes(`href="${meta.canonical}"`))
    assert.ok(head.includes('property="og:title"'))
    if (meta.noindex) assert.ok(head.includes('noindex, follow'))
    for (const alternate of meta.alternates) assert.ok(head.includes(`href="${alternate.href}"`))
    // Ignore hydration JSON/scripts: article text must be in the actual rendered body.
    const body = html.slice(html.indexOf('<body')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    const footer = body.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1]
    assert.ok(footer, 'Every page should include the visitor counter')
    assert.ok(footer.includes('lucide-users'))
    assert.equal(footer.replace(/<[^>]*>/g, '').trim(), '—', 'Footer shows only the icon and count, with no visible label')
    const route = parseNewsPath(path)
    if (route?.slug) {
      const baseArticle = techNews.find(({ slug }) => slug === route.slug)
      assert.ok(baseArticle)
      const article = localizeArticle(baseArticle, route.language)
      for (const section of article.sections) {
        assert.ok(body.includes(escape(section.heading)))
        for (const paragraph of section.paragraphs) assert.ok(body.includes(escape(paragraph)))
      }
    } else if (path === '/') {
      assert.ok(body.includes('Jacky Su.'))
      assert.ok(body.includes('About Me'))
    }
  })
}

test('static 404 is noindex and Vercel does not rewrite articles to the homepage', async () => {
  assert.ok((await readFile('build/client/404.html', 'utf8')).includes('noindex, follow'))
  const config = JSON.parse(await readFile('vercel.json', 'utf8'))
  assert.equal(config.outputDirectory, 'build/client')
  assert.equal(config.rewrites, undefined)
  assert.ok((await readFile('build/client/sitemap.xml', 'utf8')).includes(`${SITE_URL}/en/tech-news`))
})

test('published articles appear in the sitemap and the removed demo is not generated', async () => {
  const sitemap = await readFile('build/client/sitemap.xml', 'utf8')
  assert.ok(!sitemap.includes('welcome-to-tech-notes'))
  for (const language of ['zh', 'en']) {
    await assert.rejects(access(`build/client/${language}/tech-news/welcome-to-tech-notes/index.html`), { code: 'ENOENT' })
    for (const article of techNews.filter(({ demo }) => !demo)) {
      assert.ok(sitemap.includes(`${SITE_URL}/${language}/tech-news/${article.slug}`))
    }
  }
})
