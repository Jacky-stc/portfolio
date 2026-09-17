import { GalleryHorizontal, List } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const CAROUSEL_DURATION = 64000

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
          data-skill={skill.name}
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
  const [isList, setIsList] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef(null)
  const trackRef = useRef(null)
  const carouselTimeRef = useRef(0)
  const snapshotRef = useRef(null)
  const animationsRef = useRef([])

  const toggleLayout = () => {
    if (snapshotRef.current || isAnimating) return
    const container = containerRef.current
    if (!isList) {
      const carousel = trackRef.current.getAnimations().find((animation) => animation.animationName === 'skills-scroll')
      // Computed progress includes the negative delay used when resuming a previous loop.
      carouselTimeRef.current = (carousel?.effect.getComputedTiming().progress ?? 0) * CAROUSEL_DURATION
    }
    const bounds = container.getBoundingClientRect()
    const cards = new Map()

    // Pick the visible copy of each skill, even halfway through the carousel loop.
    container.querySelectorAll('[data-skill]').forEach((card) => {
      const rect = card.getBoundingClientRect()
      const distance = Math.abs(rect.left + rect.width / 2 - (bounds.left + bounds.width / 2))
      const previous = cards.get(card.dataset.skill)
      if (!previous || distance < previous.distance) {
        cards.set(card.dataset.skill, {
          rect,
          distance,
          children: Array.from(card.children, (child) => child.getBoundingClientRect()),
        })
      }
    })

    snapshotRef.current = { cards, height: bounds.height }
    setIsAnimating(true)
    setIsList((value) => !value)
  }

  useLayoutEffect(() => {
    const snapshot = snapshotRef.current
    if (!snapshot) return
    snapshotRef.current = null
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsAnimating(false)
      return
    }

    const container = containerRef.current
    const animations = []
    const targetHeight = container.getBoundingClientRect().height
    // Both copies may be visible at the saved carousel position.
    const cards = container.querySelectorAll('.skill-card')
    const targets = Array.from(cards, (card) => ({
      card,
      target: card.getBoundingClientRect(),
      children: Array.from(card.children, (child) => ({ child, rect: child.getBoundingClientRect() })),
    }))
    targets.forEach(({ card, target, children }, index) => {
      const previous = snapshot.cards.get(card.dataset.skill)
      const timing = {
        duration: 720,
        delay: (index % SKILLS.length) * 35,
        easing: 'cubic-bezier(.61,.02,.42,.87)',
        fill: 'both',
      }
      const dx = previous.rect.left - target.left
      const dy = previous.rect.top - target.top
      const scaleX = previous.rect.width / target.width
      const scaleY = previous.rect.height / target.height
      animations.push(
        card.animate(
          [{ transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})` }, { transform: 'translate(0, 0) scale(1)' }],
          timing
        )
      )

      children.forEach(({ child, rect: after }, childIndex) => {
        const before = previous.children[childIndex]
        const x = (before.left - previous.rect.left) / scaleX - (after.left - target.left)
        const y = (before.top - previous.rect.top) / scaleY - (after.top - target.top)
        animations.push(
          child.animate(
            [
              {
                transform: `translate(${x}px, ${y}px) scale(${before.width / after.width / scaleX}, ${before.height / after.height / scaleY})`,
              },
              { transform: 'translate(0, 0) scale(1)' },
            ],
            timing
          )
        )
      })
    })
    animations.push(
      container.animate([{ height: `${snapshot.height}px` }, { height: `${targetHeight}px` }], {
        duration: 720 + (SKILLS.length - 1) * 35,
        easing: 'cubic-bezier(.61,.02,.42,.87)',
      })
    )
    animationsRef.current = animations
    Promise.all(animations.map((animation) => animation.finished.catch(() => {}))).then(() => {
      if (animationsRef.current !== animations) return
      animations.forEach((animation) => animation.cancel())
      animationsRef.current = []
      setIsAnimating(false)
    })
  }, [isList])

  useEffect(() => {
    const finish = () => animationsRef.current.forEach((animation) => animation.finish())
    window.addEventListener('resize', finish)
    return () => {
      window.removeEventListener('resize', finish)
      const animations = animationsRef.current
      animationsRef.current = []
      animations.forEach((animation) => animation.cancel())
    }
  }, [])

  return (
    <section
      className="content-section skills-section"
      id="skills"
      aria-labelledby="skills-title"
    >
      <div>
        <header className="section-heading skills-heading">
          <h2
            className="section-title"
            id="skills-title"
          >
            Skills
          </h2>
          <button
            className="skills-layout-toggle"
            type="button"
            onClick={toggleLayout}
            disabled={isAnimating}
            aria-label={isList ? 'Switch to carousel view' : 'Switch to list view'}
            title={isList ? 'Carousel view' : 'List view'}
            aria-controls="skills-display"
            aria-pressed={isList}
          >
            {isList ? <GalleryHorizontal aria-hidden="true" /> : <List aria-hidden="true" />}
          </button>
        </header>

        <div
          className={`skills-carousel${isList ? ' skills-display--list' : ''}${isAnimating ? ' is-transitioning' : ''}`}
          id="skills-display"
          ref={containerRef}
          aria-label="Technical skills"
        >
          <div
            className="skills-track"
            ref={trackRef}
            style={{
              animationDuration: `${CAROUSEL_DURATION}ms`,
              animationDelay: `-${carouselTimeRef.current}ms`,
              // Freeze at the exact destination while FLIP runs. The CSS loop is
              // created only after switching finishes, starting at this same offset.
              transform: !isList && isAnimating ? `translateX(-${(carouselTimeRef.current / CAROUSEL_DURATION) * 50}%)` : undefined,
            }}
          >
            <SkillList />
            {!isList && <SkillList isDuplicate />}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Skills
