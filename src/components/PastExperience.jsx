import { ChevronsDown, ChevronsUp } from 'lucide-react'
import { useState } from 'react'

const EXPERIENCES = [
  {
    id: 'ikg',
    company: 'IKG',
    logo: '/images/IKG.webp',
    role: 'Frontend Developer',
    period: 'January 2025 - August 2026',
    location: 'Taipei, Taiwan',
    workType: 'On-site',
    highlights: [
      'Built polished, responsive web games with React and PixiJS for a Taiwan-Georgia company.',
      'Partnered with designers and product owners on visual assets, specifications, scope, and delivery timelines.',
      'Owned delivery from breakdown to release through Jira and a Scrum-based agile workflow.',
      'Improved low-end mobile performance, increasing FPS by 80% and reducing First Contentful Paint by 50%.',
      'Reduced draw calls by 90%, GPU memory usage by 60%, and CI/CD deployment time by 70%.',
      'Led the main interface migration from a DOM-based architecture to a Canvas-based rendering system.',
    ],
  },
  {
    id: 'hoplite-technology',
    company: 'Hoplite Technology',
    logo: '/images/Hoplite.webp',
    role: 'Frontend Developer',
    period: 'May 2023 - July 2024',
    location: 'Hong Kong',
    workType: 'Remote',
    highlights: [
      'Developed an online platform for Hong Kong educators with Next.js 13, Tailwind CSS, and the OpenAI API.',
      'Designed reusable, testable UI components and responsive email templates across devices and browsers.',
      'Monitored production health with AWS CloudWatch and helped maintain system stability.',
    ],
  },
  {
    id: 'wehelp',
    company: 'WeHelp',
    logo: '/images/WeHelp.webp',
    role: 'Web Trainee',
    period: 'September 2022 - March 2023',
    location: 'Taiwan',
    workType: 'Remote',
    highlights: [
      'Completed an intensive 24-week software engineering program covering full-stack foundations and front-end specialization.',
      'Built a full-stack tourism e-commerce website and collaborated with four engineers through Git flow on a Taiwan weather platform.',
    ],
  },
]

function PastExperience() {
  const [expandedExperiences, setExpandedExperiences] = useState({})

  const toggleExperience = (experienceId) => {
    setExpandedExperiences((current) => ({
      ...current,
      [experienceId]: !current[experienceId],
    }))
  }

  return (
    <section
      className="content-section experience-section"
      id="past-experience"
      aria-labelledby="past-experience-title"
    >
      <div className="section-inner">
        <header className="section-heading">
          <h2
            className="section-title"
            id="past-experience-title"
          >
            Past Experience
          </h2>
        </header>

        <ol className="work-timeline">
          {EXPERIENCES.map((experience) => {
            const isExpanded = Boolean(expandedExperiences[experience.id])
            const detailsId = `${experience.id}-details`

            return (
              <li
                className={`work-experience ${isExpanded ? 'is-expanded' : ''}`}
                key={experience.id}
              >
                <span
                  className="work-timeline-dot"
                  aria-hidden="true"
                />
                <article className="work-experience-content">
                  <header className="work-experience-header">
                    <div className="work-experience-identity">
                      <img
                        className="work-experience-logo"
                        src={experience.logo}
                        alt=""
                      />
                      <div>
                        <p className="work-experience-company">{experience.company}</p>
                        <h3>{experience.role}</h3>
                      </div>
                    </div>
                    <div className="work-experience-meta">
                      <p className="work-experience-period">{experience.period}</p>
                      <p className="work-experience-location">
                        {experience.location} · {experience.workType}
                      </p>
                    </div>
                    <button
                      className="work-experience-toggle"
                      type="button"
                      aria-controls={detailsId}
                      aria-expanded={isExpanded}
                      onClick={() => toggleExperience(experience.id)}
                    >
                      <span className="visually-hidden">
                        {isExpanded ? 'Collapse' : 'Expand'} {experience.company} experience
                      </span>
                      <span
                        className="work-experience-toggle-icon"
                        aria-hidden="true"
                      >
                        <ChevronsDown className="work-experience-chevron work-experience-chevron--down" />
                        <ChevronsUp className="work-experience-chevron work-experience-chevron--up" />
                      </span>
                    </button>
                  </header>
                  <div
                    className="work-experience-details"
                    id={detailsId}
                    aria-hidden={!isExpanded}
                  >
                    <div className="work-experience-details-inner">
                      <ul>
                        {experience.highlights.map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

export default PastExperience
