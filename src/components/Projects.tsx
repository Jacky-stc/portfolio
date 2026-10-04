import { ArrowUpRight } from 'lucide-react'

const PROJECTS = [
  {
    title: 'Taipei Day Trip',
    description:
      'A travel e-commerce platform for discovering Taipei attractions, planning day trips, and booking guided experiences online.',
    image: '/images/taipei-day-trip.webp',
    technologies: ['JavaScript', 'Python', 'MySQL', 'TapPay', 'EC2', 'S3'],
  },
  {
    title: 'Whisper',
    description: 'A real-time social platform where users can connect, share updates, and chat through a responsive online experience.',
    image: '/images/whisper.webp',
    technologies: ['React', 'Redux', 'Firebase', 'Emotion'],
  },
  {
    title: 'NCCU PSY Volleyball Team',
    description:
      'A team website featuring player profiles, match highlights, photo archives, and the history of the NCCU Psychology Volleyball Team.',
    image: '/images/psy-volleyball.webp',
    url: 'https://www.psyvolleyball.com/',
    technologies: ['Next.js', 'RDS', 'S3', 'Google Maps API'],
  },
  {
    title: 'Secure Chat',
    description:
      'An AI-powered education platform built for online teachers in Hong Kong to create secure, focused, and engaging learning conversations.',
    image: '/images/secureChat.webp',
    technologies: ['Next.js', 'Tailwind CSS', 'Framer Motion'],
  },
  {
    title: 'Boray House Renting',
    description:
      'An internal property search system for a real estate company, helping staff find rental listings and access property information in one place.',
    image: '/images/boray-house-renting.webp',
    technologies: ['Next.js', 'Tailwind CSS', 'Redux', 'Google Sheets API', 'Apps Script'],
  },
]

function Projects() {
  return (
    <section
      className="content-section projects-section"
      id="projects"
      aria-labelledby="projects-title"
    >
      <div>
        <header className="section-heading">
          <h2
            className="section-title"
            id="projects-title"
          >
            Projects
          </h2>
        </header>

        <div className="projects-list">
          {PROJECTS.map((project) => (
            <article
              className="project-card"
              key={project.title}
            >
              <div className="project-image-frame">
                <img
                  className="project-image"
                  src={project.image}
                  alt={`${project.title} website preview`}
                  loading="lazy"
                />
              </div>

              <div className="project-content">
                <div className="project-title-row">
                  {project.url ? (
                    <a
                      className="project-title-link"
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Visit ${project.title} website`}
                    >
                      <h3>{project.title}</h3>
                      <ArrowUpRight
                        className="project-title-icon"
                        aria-hidden="true"
                      />
                    </a>
                  ) : (
                    <h3>{project.title}</h3>
                  )}
                </div>
                <p className="project-description">{project.description}</p>

                <ul
                  className="project-technologies"
                  aria-label={`${project.title} technologies`}
                >
                  {project.technologies.map((technology) => (
                    <li key={technology}>{technology}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Projects
