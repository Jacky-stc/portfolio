import LoftScene from './components/LoftScene'

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

        <section
          className="content-section"
          id="past-experience"
        >
          <div>
            <span>01</span>
            <h2>Past Experience</h2>
          </div>
        </section>

        <section
          className="content-section"
          id="side-projects"
        >
          <div>
            <span>02</span>
            <h2>Side Projects</h2>
          </div>
        </section>
      </main>
    </>
  )
}

export default App
