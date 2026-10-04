import { copyFile, writeFile } from 'node:fs/promises'
import { prerenderPaths } from '../src/routing/prerenderPaths.ts'
import { SITE_URL } from '../src/seo/site.ts'
import { pageMetadata } from '../src/seo/metadata.ts'

// Static hosts serve this file with a 404 status; do not rewrite missing URLs to the home page.
await copyFile('build/client/404/index.html', 'build/client/404.html')
const origin = new URL(process.env.VITE_SITE_URL || SITE_URL).origin
const paths = prerenderPaths.filter((path) => !pageMetadata(path, origin).noindex)
await writeFile(
  'build/client/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${origin}${path}</loc></url>`).join('')}</urlset>\n`
)
await writeFile('build/client/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`)
console.log('Prepared static 404, sitemap.xml and robots.txt')
