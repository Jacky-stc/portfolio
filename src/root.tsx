import { Analytics } from '@vercel/analytics/react'
import { Links, Scripts, ScrollRestoration, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import App from './App'
import PageMetadata from './components/PageMetadata'
import { parseNewsPath } from './routing/newsPaths'
import './styles.css'

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <html lang={parseNewsPath(pathname)?.language || 'en'}>
      <head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <meta
          name="theme-color"
          content="#40393b"
        />
        <PageMetadata />
        <link
          rel="icon"
          type="image/svg+xml"
          href="/favicon.svg"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/favicon-96x96.png"
        />
        <link
          rel="shortcut icon"
          href="/favicon.ico"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta
          name="apple-mobile-web-app-title"
          content="Jacky Su"
        />
        <link
          rel="manifest"
          href="/site.webmanifest"
        />
        <Links />
      </head>
      <body>
        {children}
        <Analytics />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default App
