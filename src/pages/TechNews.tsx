import { ArrowLeft, ArrowUpRight, Clock } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { formatNewsDate, localizeArticle, readingMinutes, techNews } from '../data/techNews'
import { newsPath, parseNewsPath } from '../routing/newsPaths'
import ViewCount from '../components/ViewCount'

import type { NewsArticle, NewsLanguage } from '../data/techNews'

function ArticleMeta({ article, language }: { article: NewsArticle; language: NewsLanguage }) {
  return (
    <div className="news-meta">
      <time dateTime={article.date}>{formatNewsDate(article.date, language)}</time>
      <span>
        <Clock aria-hidden="true" /> {readingMinutes(article)} {language === 'zh-TW' ? '分鐘閱讀' : 'min read'}
      </span>
      {article.demo && <span className="news-demo">{language === 'zh-TW' ? '版型示範' : 'Layout preview'}</span>}
    </div>
  )
}

export default function TechNews() {
  const { pathname } = useLocation()
  const route = parseNewsPath(pathname)
  const language = route?.language || 'en'
  const chinese = language === 'zh-TW'
  const entries = useMemo(() => techNews.map((entry) => localizeArticle(entry, language)), [language])
  const isList = !!route && !route.slug
  const article = route && entries.find(({ slug }) => slug === route.slug)

  if (!route || (!isList && !article))
    return (
      <section
        className="content-section news-page"
        lang={language}
      >
        <div>
          <p className="news-eyebrow">404</p>
          <h1 className="news-title">{chinese ? '找不到這個頁面。' : 'Page not found.'}</h1>
          <p className="news-intro">
            {chinese ? '頁面可能已移動，或文章尚未發布。' : 'This page may have moved, or the article is not available yet.'}
          </p>
          <Link
            className="news-back"
            to={newsPath(language)}
          >
            <ArrowLeft aria-hidden="true" /> {chinese ? '返回新聞列表' : 'Back to Tech News'}
          </Link>
        </div>
      </section>
    )

  return (
    <section
      className="content-section news-page"
      lang={language}
    >
      <div>
        <div
          className="news-language"
          role="group"
          aria-label="Article language / 文章語言"
        >
          <Link
            to={newsPath('zh-TW', route.slug)}
            lang="zh-TW"
            aria-current={chinese ? 'page' : undefined}
          >
            繁體中文
          </Link>
          <Link
            to={newsPath('en', route.slug)}
            lang="en"
            aria-current={!chinese ? 'page' : undefined}
          >
            English
          </Link>
        </div>
        {isList ? (
          <>
            <p className="news-eyebrow">THE READING ROOM</p>
            <h1 className="news-title">
              Tech News<span>.</span>
            </h1>
            <p className="news-intro">
              {chinese
                ? '前端與 AI：值得關注的消息、觀點與技術細節。'
                : 'Frontend & AI — stories, ideas, and the details worth paying attention to.'}
            </p>
            <ol className="news-list">
              {[...entries]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((entry) => (
                  <li key={entry.slug}>
                    <Link
                      className="news-card"
                      to={newsPath(language, entry.slug)}
                    >
                      <div>
                        <ArticleMeta
                          article={entry}
                          language={language}
                        />
                        <h2>
                          {entry.title}
                          <ArrowUpRight aria-hidden="true" />
                        </h2>
                        <p>{entry.summary}</p>
                        <div className="news-tags-row">
                          <div className="news-tags">
                            {entry.tags.map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                          <ViewCount
                            slug={entry.slug}
                            language={language}
                          />
                        </div>
                      </div>
                      {entry.image && (
                        <img
                          src={entry.image}
                          alt={entry.imageAlt}
                          loading="lazy"
                          width="640"
                          height="400"
                        />
                      )}
                    </Link>
                  </li>
                ))}
            </ol>
            {!entries.length && (
              <p className="news-intro">{chinese ? '第一篇文章準備中，敬請期待。' : 'The first story is on its way. Check back soon.'}</p>
            )}
          </>
        ) : article ? (
          <article className="news-article">
            <Link
              className="news-back"
              to={newsPath(language)}
            >
              <ArrowLeft aria-hidden="true" /> {chinese ? '所有文章' : 'All stories'}
            </Link>
            <ArticleMeta
              article={article}
              language={language}
            />
            <h1 className="news-title">{article.title}</h1>
            <p className="news-intro">{article.summary}</p>
            <div className="news-tags-row news-article-tags">
              <div className="news-tags">
                {article.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <ViewCount
                key={article.slug}
                slug={article.slug}
                language={language}
                track
              />
            </div>
            {article.image && (
              <figure>
                <img
                  src={article.image}
                  alt={article.imageAlt}
                  width="640"
                  height="400"
                />
                {article.imageCaption && <figcaption>{article.imageCaption}</figcaption>}
              </figure>
            )}
            {article.sections.map(({ heading, paragraphs }) => (
              <section
                className="news-prose"
                key={heading}
              >
                <h2>{heading}</h2>
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </section>
            ))}
            {!!article.sources.length && (
              <section className="news-prose">
                <h2>{chinese ? '資料來源與延伸閱讀' : 'Sources & further reading'}</h2>
                <ul>
                  {article.sources.map(({ label, url }) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        ) : null}
      </div>
    </section>
  )
}
