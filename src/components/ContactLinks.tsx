import type { CSSProperties } from 'react'

const CONTACTS = [
  { name: 'GitHub', icon: 'github', href: 'https://github.com/Jacky-stc' },
  { name: 'Email', icon: 'email', href: 'mailto:stzuchieh@gmail.com' },
  { name: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/in/tzu-chieh-su-a68969248/' },
  { name: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com/su.zi.jie.88255' },
  { name: 'Instagram', icon: 'instagram', href: null },
]

export default function ContactLinks() {
  return (
    <ul
      className="hero-contacts"
      aria-label="Contact Jacky"
    >
      {CONTACTS.map(({ name, icon, href }) => {
        const graphic = (
          <span
            className="contact-icon"
            style={{ '--contact-icon': `url('/images/contact-${icon}.webp')` } as CSSProperties}
            aria-hidden="true"
          />
        )
        return (
          <li key={name}>
            {href ? (
              <a
                className="contact-link"
                href={href}
                aria-label={name}
                title={name}
                target={href.startsWith('https:') ? '_blank' : undefined}
                rel={href.startsWith('https:') ? 'noopener noreferrer' : undefined}
              >
                {graphic}
              </a>
            ) : (
              <span
                className="contact-link"
                role="link"
                aria-disabled="true"
                aria-label={`${name} — link coming soon`}
                title={`${name} — link coming soon`}
              >
                {graphic}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
