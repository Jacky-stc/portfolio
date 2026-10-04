export default function AboutMe() {
  return (
    <section
      className="content-section about-section"
      id="about"
      aria-labelledby="about-title"
    >
      <div>
        <h2
          className="section-title"
          id="about-title"
        >
          About Me
        </h2>
        <div className="about-content">
          <div className="about-copy">
            <p>
              Hello! I’m Jacky, a frontend developer who enjoys bringing interfaces to life through carefully considered interactions and
              responsive design.
            </p>
            <p>
              My development journey includes full-stack training at WeHelp, building an AI-powered education platform at Hoplite
              Technology, and creating interactive web games at IKG. These experiences have taken me from React and Next.js applications to
              graphics-heavy interfaces with PixiJS and Canvas.
            </p>
            <p>
              I care about how an interface feels as much as how it looks. I enjoy improving performance on mobile devices, building
              reusable components, and working with designers and product teams to turn ideas into finished experiences.
            </p>
            <p>
              My projects span travel, real-time communication, education, and property search. Each one is an opportunity to explore a
              different problem and build something useful.
            </p>
          </div>
          <aside
            className="about-focus"
            aria-label="Development focus"
          >
            <p className="about-focus-label">What I focus on</p>
            <ul>
              <li>
                <strong>Thoughtful interfaces</strong>
                <span>Responsive layouts and reusable components.</span>
              </li>
              <li>
                <strong>Meaningful interactions</strong>
                <span>Animation and details that make interfaces feel natural.</span>
              </li>
              <li>
                <strong>Smooth performance</strong>
                <span>Fast, fluid experiences across devices.</span>
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
