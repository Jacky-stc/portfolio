import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import Header from './components/Header'
import ParticleBackground from './components/ParticleBackground'
import ViewCount from './components/ViewCount'

function App() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const previousPath = useRef(pathname)
  useEffect(() => {
    if (previousPath.current !== pathname) mainRef.current?.focus({ preventScroll: true })
    previousPath.current = pathname
  }, [pathname])
  return (
    <div className="site-shell">
      <div
        className="site-background"
        aria-hidden="true"
      />
      <ParticleBackground />
      <Header />
      <main
        ref={mainRef}
        className="site-content"
        tabIndex={-1}
      >
        <Outlet />
      </main>
      <footer className="site-footer">
        <ViewCount track />
      </footer>
    </div>
  )
}

export default App
