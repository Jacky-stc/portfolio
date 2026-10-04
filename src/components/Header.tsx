import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { newsPath, parseNewsPath } from '../routing/newsPaths'

const SECTIONS = [
  { id: 'about', label: 'About Me' },
  { id: 'past-experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
]

export default function Header() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const newsRoute = parseNewsPath(pathname)
  const newsHref = newsPath(newsRoute?.language)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('home')
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    setOpen(false)
  }, [pathname])
  const links = isHome
    ? [...SECTIONS.map((section) => ({ ...section, href: `/#${section.id}` })), { id: 'tech-news', label: 'Tech News', href: newsHref }]
    : [
        { id: 'home', label: 'Home', href: '/' },
        { id: 'tech-news', label: 'Tech News', href: newsHref },
      ]

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setScrolled(window.scrollY > 16)
      const threshold = window.innerHeight * 0.35
      let current = 'home'
      SECTIONS.forEach(({ id }) => {
        const section = document.getElementById(id)
        if (section && section.getBoundingClientRect().top <= threshold) current = id
      })
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const onResize = () => {
      setOpen(false)
      onScroll()
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [pathname])

  return (
    <header
      className={['site-header', scrolled || open ? 'is-scrolled' : ''].filter(Boolean).join(' ')}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          buttonRef.current?.focus()
        }
      }}
    >
      <div className="header-inner">
        <Link
          className="header-brand"
          to="/"
          aria-label="Jacky Su — home"
          onClick={() => setOpen(false)}
        >
          <img
            className="header-avatar"
            src="/images/jacky-avatar.webp"
            alt=""
            width="48"
            height="48"
          />
        </Link>
        <button
          ref={buttonRef}
          className="header-menu-toggle"
          type="button"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <nav
          id="main-navigation"
          className={['header-nav', open ? 'is-open' : ''].filter(Boolean).join(' ')}
          aria-label="Main navigation"
        >
          {links.map(({ id, label, href }) => (
            <Link
              key={id}
              to={href}
              aria-current={!isHome && id === 'tech-news' && newsRoute ? 'page' : isHome && active === id ? 'location' : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
