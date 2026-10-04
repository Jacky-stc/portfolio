import { ArrowLeft, ArrowUpRight, Clock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { formatNewsDate, localizeArticle, readingMinutes, techNews } from '../data/techNews'

function ArticleMeta({ article, language }) {
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

export default function TechNews({ pathname }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('news-language') === 'en' ? 'en' : 'zh-TW'
    } catch {
      return 'zh-TW'
    }
  })
  const chinese = language === 'zh-TW'
  const entries = useMemo(() => techNews.map((entry) => localizeArticle(entry, language)), [language])
  const isList = pathname === '/tech-news'
  const article = entries.find(({ slug }) => pathname === `/tech-news/${slug}`)
  useEffect(() => {
    try {
      localStorage.setItem('news-language', language)
    } catch {
      /* Storage can be unavailable in privacy mode. */
    }
  }, [language])
  useEffect(() => {
    const original = document.title
    document.title = `${isList ? 'Tech News' : article?.title || 'Page not found'} | Jacky Su`
    return () => {
      document.title = original
    }
  }, [isList, article])

  if (!isList && !article)
    return (
      <section className="content-section news-page">
        <div>
          <p className="news-eyebrow">404</p>
          <h1 className="news-title">Page not found.</h1>
          <p className="news-intro">This page may have moved, or the article is not available yet.</p>
          <a
            className="news-back"
            href="/tech-news"
          >
            <ArrowLeft aria-hidden="true" /> Back to Tech News
          </a>
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
          <button
            type="button"
            lang="zh-TW"
            aria-pressed={chinese}
            onClick={() => setLanguage('zh-TW')}
          >
            繁體中文
          </button>
          <button
            type="button"
            lang="en"
            aria-pressed={!chinese}
            onClick={() => setLanguage('en')}
          >
            English
          </button>
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
                    <a
                      className="news-card"
                      href={`/tech-news/${entry.slug}`}
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
                        <div className="news-tags">
                          {entry.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
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
                    </a>
                  </li>
                ))}
            </ol>
            {!entries.length && (
              <p className="news-intro">{chinese ? '第一篇文章準備中，敬請期待。' : 'The first story is on its way. Check back soon.'}</p>
            )}
          </>
        ) : (
          <article className="news-article">
            <a
              className="news-back"
              href="/tech-news"
            >
              <ArrowLeft aria-hidden="true" /> {chinese ? '所有文章' : 'All stories'}
            </a>
            <ArticleMeta
              article={article}
              language={language}
            />
            <h1 className="news-title">{article.title}</h1>
            <p className="news-intro">{article.summary}</p>
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
        )}
      </div>
    </section>
  )
}
