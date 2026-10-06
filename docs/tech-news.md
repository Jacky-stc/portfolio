# Tech News

- `/` renders the portfolio.
- `/zh/tech-news` and `/en/tech-news` list articles newest first in Traditional Chinese and English.
- `/zh/tech-news/:slug` and `/en/tech-news/:slug` render the same article in each language; unknown paths display a not-found page.
- Only language-prefixed news URLs are supported; paths without `/zh` or `/en` use the site's not-found behavior.
- React Router Framework Mode uses a shared `App` layout with `Outlet`, preserving the Header and particle background. Internal links use `Link`; external links remain native anchors. `ScrollRestoration` handles back/forward positions, page resets and hash anchors. Direct visits receive prerendered HTML. Route definitions live in `src/routes.ts`; no custom history or click interception is used.

## Add an article

Create `src/data/news/YYYY-MM-DD.json`, one article per Taiwan publication day, containing both languages in the same file. Use a unique URL-safe `slug`, publication `date` matching the filename, English `title`, `summary`, `tags`, `sections` (heading and paragraphs), and `sources` (label and URL), plus the complete Traditional Chinese content in `translations['zh-TW']`. Optional image fields: `image`, `imageAlt`, `imageCaption`. Store owned/licensed images in `public/images` and reference them with `/images/...`.

The `pnpm news:generate` script scans all daily JSON files and regenerates `src/data/news/index.ts`; do not edit that index manually. `pnpm dev`, `pnpm typecheck`, `pnpm build`, `pnpm test`, and `pnpm test:ssg` run the generator automatically. If the dev server is already running when a new JSON is added, rerun `pnpm news:generate` or restart the server. Commit the regenerated index with each new daily JSON and any necessary images. Its explicit JSON imports work in the browser, SSG, Node tests, and the Vercel API without runtime filesystem scanning or Vite-only glob APIs. `src/data/techNews.ts` contains only shared types, the newest-first catalog, and formatting/localization helpers; do not put article bodies there. Tests reject duplicate publication dates and filename/date mismatches.

The first sourced bilingual digest was added on October 4, 2026, replacing the layout preview. The digest date is distinct from the original sources' publication dates, which must be stated in the article.

Slugs must describe the actual story using concise lowercase English keywords separated by hyphens, such as `openai-devday-2026-github-css-modules`. Prefer concrete product, event, or technology names; do not use generic names such as `frontend-ai-digest` or a date alone. Keep the publication date in `date`; include a year in the slug only when it identifies the event or topic. Both languages share the same slug.

## Languages and daily publishing

English content lives in the base article fields. Add a complete `translations['zh-TW']` object with translated title, summary, tags, sections, imageAlt, imageCaption, and optionally source labels. Keep the slug, date, image path and source URLs identical across languages. Language is determined only by the URL, not localStorage. Language links preserve the article slug; list links and Header retain the current news language. Reading time is calculated separately for the selected text. Daily publication reports should include both language URLs.

## Metadata

`PageMetadata` is rendered once in the shared layout and uses React 19's head metadata support. `src/seo/metadata.ts` derives localized title/description, self-canonical, reciprocal `zh-TW`/`en` and `x-default` alternates, Open Graph and Twitter tags. `src/seo/site.ts` fixes the production origin to `https://www.jackysu.dev`; `VITE_SITE_URL` may explicitly override it. Preview hosts do not become canonical URLs. Query strings and trailing slashes are omitted from canonical URLs. The document language updates with the route.

An optional per-article `socialImage` and localized `socialImageAlt` can supply a raster share image. SVG article illustrations fall back to the provided raster avatar for social cards. Missing pages and demo articles use `noindex, follow`; missing pages omit canonical/hreflang. Returning home removes article-specific metadata.

`src/root.tsx` renders the complete HTML document, including metadata and the language attribute, during SSG. The default React Router client entry hydrates that document; no manual `createRoot` or browser-only metadata effect is needed. Article text and metadata are present before JavaScript runs. Client-side navigation continues to update them without remounting the shared Header.

A Codex thread automation is scheduled for 09:00 Asia/Taipei daily to research and publish one bilingual frontend and AI digest. This is the start of research, not a guarantee that Vercel is live at exactly 09:00. It is not a Vercel Cron job. The local Codex host, network access and Git credentials must be available for local execution. Do not claim cloud-only unattended operation.

Use primary sources, clearly distinguish original announcement dates from the digest date, and never fabricate news. Before adding a daily article, check the existing `date` fields for the Taiwan publication date to avoid duplicates; do not infer the date from a slug. Each article must also have a unique content-based slug. Use original/licensed images only. If evidence is insufficient, skip publication and report the reason.

Write both languages in a natural editorial voice. Use specific story headings rather than category prefixes such as “Frontend:”, “AI:”, or “My takeaway:”. Avoid generic conclusions, personal claims attributed to the site owner, and formulaic commentary sections. Keep source attribution and availability caveats within the relevant paragraphs.

The user authorized news-only commits and normal pushes to origin/main. Stop when the working tree/index is dirty, unknown commits are pending, the branch differs, or Git operations/conflicts are in progress. Never overwrite, stash, reset, force push or include unrelated work. Fetch and fast-forward only. Review explicit paths and run formatting/data validation/build before committing. On push failure preserve the commit and avoid duplicate articles. Report push success separately from verified Vercel deployment success.

## Deployment

`react-router.config.ts` enables `ssr: false` and prerenders every path from `src/routing/prerenderPaths.ts`. New article slugs are automatically included for both languages on each build. Browser-only animation and canvas code stays in effects, so it does not run during static rendering.

Run `pnpm test`, `pnpm build`, then `pnpm test:ssg` before publishing. Build first runs `pnpm typecheck` in strict mode. Source components use `.tsx`; data, API, configuration, scripts, and tests use `.ts`. The `tsx` runner executes build scripts and tests. The SSG tests read generated HTML and verify actual body text, metadata, language, canonical links, and the 404 output. Use `pnpm dev` for development and `pnpm preview` to preview `build/client` locally. Development does not write the production HTML files.

`vercel.json` explicitly sets a static build (`pnpm build`, output `build/client`) with no redirects or SPA rewrites. Vercel should serve generated paths directly and missing paths with its static 404 behavior. The postbuild script copies the prerendered not-found page to `404.html`, generates `sitemap.xml` (excluding noindex/demo pages), and generates `robots.txt`. The generated SPA fallback is not configured as a catch-all, avoiding HTTP 200 responses for missing articles. A client-side 404 is only a rendered view; a direct missing request is handled by the host.

Node 22.22+ is required by the installed React Router framework tooling; configure Vercel to use a compatible Node release. The Vercel Git integration must track `main` for pushes to trigger production deployments. No deployment credentials are stored in this repository. Generated `build/` and `.react-router/` directories are ignored by Git. This is build-time SSG, not a runtime SSR server; content changes require a rebuild/deployment.
