import AboutMe from './components/AboutMe'
import Header from './components/Header'
import Hero from './components/Hero'
import ParticleBackground from './components/ParticleBackground'
import PastExperience from './components/PastExperience'
import Projects from './components/Projects'
import Skills from './components/Skills'
import TechNews from './pages/TechNews'

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  const isHome = pathname === '/'
  return (
    <>
      <div
        className="site-background"
        aria-hidden="true"
      />
      <ParticleBackground />
      <Header isHome={isHome} />
      <main className="site-content">
        {isHome ? (
          <>
            <Hero />
            <AboutMe />
            <PastExperience />
            <Skills />
            <Projects />
          </>
        ) : (
          <TechNews pathname={pathname} />
        )}
      </main>
    </>
  )
}

export default App
