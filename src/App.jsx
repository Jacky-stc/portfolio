import ParticleBackground from './components/ParticleBackground'
import PastExperience from './components/PastExperience'
import Projects from './components/Projects'
import Skills from './components/Skills'

function App() {
  return (
    <>
      <div
        className="site-background"
        aria-hidden="true"
      />
      <ParticleBackground />
      <main className="site-content">
        <PastExperience />
        <Skills />
        <Projects />
      </main>
    </>
  )
}

export default App
