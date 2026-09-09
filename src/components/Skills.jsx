const SKILLS = [
  { name: 'HTML5', icon: '/images/html5.webp' },
  { name: 'CSS3', icon: '/images/css3.webp' },
  { name: 'JavaScript', icon: '/images/javascript.webp' },
  { name: 'TypeScript', icon: '/images/typescript.webp' },
  { name: 'React', icon: '/images/reactjs.webp' },
  { name: 'Next.js', icon: '/images/nextjs.webp' },
  { name: 'Tailwind CSS', icon: '/images/tailwind.webp' },
  { name: 'Vitest', icon: '/images/vitest.webp' },
  { name: 'MySQL', icon: '/images/mysql.webp' },
  { name: 'Firebase', icon: '/images/firebase.webp' },
  { name: 'AWS', icon: '/images/aws-light.webp' },
  { name: 'Docker', icon: '/images/docker.webp' },
  { name: 'Git', icon: '/images/git.webp' },
  { name: 'Postman', icon: '/images/postman.webp' },
]

function SkillList({ isDuplicate = false }) {
  return (
    <ul
      className="skills-list"
      aria-hidden={isDuplicate || undefined}
    >
      {SKILLS.map((skill) => (
        <li
          className="skill-card"
          key={skill.name}
        >
          <img
            className="skill-icon"
            src={skill.icon}
            alt=""
            loading="lazy"
          />
          <span>{skill.name}</span>
        </li>
      ))}
    </ul>
  )
}

function Skills() {
  return (
    <section
      className="content-section skills-section"
      id="skills"
      aria-labelledby="skills-title"
    >
      <div>
        <header className="section-heading">
          <h2
            className="section-title"
            id="skills-title"
          >
            Skills
          </h2>
        </header>

        <div
          className="skills-carousel"
          aria-label="Technical skills"
        >
          <div className="skills-track">
            <SkillList />
            <SkillList isDuplicate />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Skills
