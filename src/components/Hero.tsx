import { useEffect, useState } from 'react'
import ContactLinks from './ContactLinks'

const LINES = ['Jacky Su.', 'I build interactive web experiences.']
const TOTAL = LINES.join('').length

function TypedText({ index, count }: { index: number; count: number }) {
  const start = LINES.slice(0, index).join('').length
  const length = Math.max(0, Math.min(LINES[index].length, count - start))
  const typing = count >= start && count < start + LINES[index].length
  const showCaret = typing || (index === LINES.length - 1 && count >= TOTAL)
  return (
    <>
      <span className="visually-hidden">{LINES[index]}</span>
      <span
        className="typed-text"
        aria-hidden="true"
      >
        <span className="typed-placeholder">{LINES[index]}</span>
        <span className="typed-visible">
          {LINES[index].slice(0, length)}
          {showCaret && <span className="typing-caret" />}
        </span>
      </span>
    </>
  )
}

export default function Hero() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer: ReturnType<typeof setInterval> | undefined
    const finish = () => {
      clearInterval(timer)
      setCount(TOTAL)
    }
    if (preference.matches) finish()
    else {
      let progress = 0
      timer = setInterval(() => {
        progress += 1
        setCount(progress)
        if (progress >= TOTAL) clearInterval(timer)
      }, 24)
    }
    const onPreference = () => {
      if (preference.matches) finish()
    }
    preference.addEventListener('change', onPreference)
    return () => {
      clearInterval(timer)
      preference.removeEventListener('change', onPreference)
    }
  }, [])

  return (
    <section
      className="content-section hero-section"
      id="home"
      aria-labelledby="hero-title"
    >
      <div>
        <p className="hero-intro">Hi, my name is</p>
        <h1
          id="hero-title"
          className="hero-title"
        >
          <TypedText
            index={0}
            count={count}
          />
        </h1>
        <p className="hero-tagline">
          <TypedText
            index={1}
            count={count}
          />
        </p>
        <p className="hero-description">
          I’m a software engineer focused on frontend development. Currently opening to new opportunities and collaborations—feel free to
          get in touch.
        </p>
        <ContactLinks />
      </div>
    </section>
  )
}
