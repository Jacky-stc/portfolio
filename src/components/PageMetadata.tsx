import { useLocation } from 'react-router'
import { pageMetadata } from '../seo/metadata'
import { SITE_URL } from '../seo/site'

export default function PageMetadata() {
  const { pathname } = useLocation()
  const meta = pageMetadata(pathname, import.meta.env.VITE_SITE_URL || SITE_URL)
  return (
    <>
      <title>{meta.title}</title>
      <meta
        name="description"
        content={meta.description}
      />
      <meta
        name="robots"
        content={meta.noindex ? 'noindex, follow' : 'index, follow'}
      />
      {meta.canonical && (
        <link
          rel="canonical"
          href={meta.canonical}
        />
      )}
      {meta.alternates.map(({ language, href }) => (
        <link
          key={language}
          rel="alternate"
          hrefLang={language}
          href={href}
        />
      ))}
      <meta
        property="og:title"
        content={meta.title}
      />
      <meta
        property="og:description"
        content={meta.description}
      />
      <meta
        property="og:type"
        content={meta.type}
      />
      <meta
        property="og:site_name"
        content="Jacky Su"
      />
      <meta
        property="og:locale"
        content={meta.language === 'zh-TW' ? 'zh_TW' : 'en_US'}
      />
      {meta.alternates.length > 0 && (
        <meta
          property="og:locale:alternate"
          content={meta.language === 'zh-TW' ? 'en_US' : 'zh_TW'}
        />
      )}
      {meta.canonical && (
        <meta
          property="og:url"
          content={meta.canonical}
        />
      )}
      {meta.image && (
        <meta
          property="og:image"
          content={meta.image}
        />
      )}
      {meta.image && (
        <meta
          property="og:image:alt"
          content={meta.imageAlt}
        />
      )}
      {meta.published && (
        <meta
          property="article:published_time"
          content={meta.published}
        />
      )}
      <meta
        name="twitter:card"
        content="summary"
      />
      <meta
        name="twitter:title"
        content={meta.title}
      />
      <meta
        name="twitter:description"
        content={meta.description}
      />
      {meta.image && (
        <meta
          name="twitter:image"
          content={meta.image}
        />
      )}
      {meta.image && (
        <meta
          name="twitter:image:alt"
          content={meta.imageAlt}
        />
      )}
    </>
  )
}
