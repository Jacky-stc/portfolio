# Tech News

- `/` renders the portfolio.
- `/tech-news` lists articles newest first.
- `/tech-news/:slug` renders the matching article; unknown paths display a not-found page.
- Navigation uses native links (including browser back/forward and opening in a new tab).

## Add an article

Add an entry to `src/data/techNews.js` with a unique URL-safe `slug`, publication `date` (`YYYY-MM-DD`), `title`, `summary`, `tags`, `sections` (heading and paragraphs), and `sources` (label and URL). Optional image fields: `image`, `imageAlt`, `imageCaption`. Store owned/licensed images in `public/images` and reference them with `/images/...`. Reading time is calculated from article text; English and Chinese are supported.

The included entry is explicitly marked as a layout preview (`demo: true`), not real news. Replace it when publishing the first sourced daily digest.

## Languages and daily publishing

English content lives in the base article fields. Add a complete `translations['zh-TW']` object with translated title, summary, tags, sections, imageAlt, imageCaption, and optionally source labels. Keep the slug, date, image path and source URLs identical across languages. The reader can switch languages on the list or detail page; Traditional Chinese is the default and the selection persists locally. Reading time is calculated separately for the selected text.

A Codex thread automation is scheduled for 09:00 Asia/Taipei daily to research and publish one bilingual frontend and AI digest. This is the start of research, not a guarantee that Vercel is live at exactly 09:00. It is not a Vercel Cron job. The local Codex host, network access and Git credentials must be available for local execution. Do not claim cloud-only unattended operation.

Use primary sources, clearly distinguish original announcement dates from the digest date, and never fabricate news. One unique daily slug per Taiwan date prevents duplicates. Use original/licensed images only. If evidence is insufficient, skip publication and report the reason.

The user authorized news-only commits and normal pushes to origin/main. Stop when the working tree/index is dirty, unknown commits are pending, the branch differs, or Git operations/conflicts are in progress. Never overwrite, stash, reset, force push or include unrelated work. Fetch and fast-forward only. Review explicit paths and run formatting/data validation/build before committing. On push failure preserve the commit and avoid duplicate articles. Report push success separately from verified Vercel deployment success.

## Deployment

This Vite app selects pages from the URL pathname. `vercel.json` rewrites `/tech-news` and `/tech-news/*` to `/index.html` without changing the URL, enabling direct article visits and reloads. The Vercel Git integration must track `main` for pushes to trigger production deployments. Vite's local server supports the same history fallback. No deployment credentials are stored in this repository.
