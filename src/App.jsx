import LoftScene from './components/LoftScene'
import PastExperience from './components/PastExperience'
import Skills from './components/Skills'

function App() {
  return (
    <>
      <div
        className="site-background"
        aria-hidden="true"
      />
      <main className="site-content">
        <section
          className="experience"
          id="loft"
          aria-label="Interactive portfolio room"
        >
          <LoftScene />
        </section>

        <PastExperience />
        <Skills />

        <section
          className="content-section"
          id="side-projects"
        >
          <div>
            <h2 className="section-title">Side Projects</h2>
          </div>
        </section>
      </main>
    </>
  )
}

export default App
