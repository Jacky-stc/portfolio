import { useEffect, useRef } from 'react'

const MIN_PARTICLES = 36
const MAX_PARTICLES = 90
const PARTICLE_DENSITY = 18000
const MAX_PIXEL_RATIO = 1.5
const FORCE_MULTIPLIER = 0.02
const VELOCITY_DAMPING = 0.9
const SETTLE_THRESHOLD = 0.05
const RESIZE_DELAY = 120

function getParticleCount(width, height) {
  return Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, Math.round((width * height) / PARTICLE_DENSITY)))
}

function createParticle(width, height) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    velocityX: 0,
    velocityY: 0,
    escapeAngle: Math.random() * Math.PI * 2,
    radius: 0.7 + Math.random() * 1.2,
    opacity: 0.2 + Math.random() * 0.45,
  }
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pointer = { active: false, clientX: 0, clientY: 0, x: 0, y: 0 }

    let animationFrame = 0
    let resizeTimer = 0
    let particles = []
    let canvasWidth = 0
    let canvasHeight = 0
    let pixelRatio = 1
    let repulsionRadius = 0
    let repulsionDistance = 0

    const draw = () => {
      animationFrame = 0
      context.clearRect(0, 0, canvasWidth, canvasHeight)

      let isMoving = false

      particles.forEach((particle) => {
        if (pointer.active) {
          const distanceX = particle.x - pointer.x
          const distanceY = particle.y - pointer.y
          const distance = Math.hypot(distanceX, distanceY)

          if (distance < repulsionRadius) {
            const safeDistance = Math.max(distance, 0.01)
            const force = (repulsionRadius - distance) / repulsionRadius
            const directionX = distance > 0.01 ? distanceX / safeDistance : Math.cos(particle.escapeAngle)
            const directionY = distance > 0.01 ? distanceY / safeDistance : Math.sin(particle.escapeAngle)

            particle.velocityX += directionX * force * repulsionDistance * FORCE_MULTIPLIER
            particle.velocityY += directionY * force * repulsionDistance * FORCE_MULTIPLIER
          }
        }

        particle.velocityX *= VELOCITY_DAMPING
        particle.velocityY *= VELOCITY_DAMPING

        const nextX = clamp(particle.x + particle.velocityX, particle.radius, canvasWidth - particle.radius)
        const nextY = clamp(particle.y + particle.velocityY, particle.radius, canvasHeight - particle.radius)

        if (nextX !== particle.x + particle.velocityX) particle.velocityX = 0
        if (nextY !== particle.y + particle.velocityY) particle.velocityY = 0

        particle.x = nextX
        particle.y = nextY

        if (Math.abs(particle.velocityX) > SETTLE_THRESHOLD || Math.abs(particle.velocityY) > SETTLE_THRESHOLD) {
          isMoving = true
        } else {
          particle.velocityX = 0
          particle.velocityY = 0
        }

        context.beginPath()
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        context.fillStyle = `rgba(255, 248, 238, ${particle.opacity})`
        context.fill()
      })

      if (isMoving && !document.hidden) {
        animationFrame = window.requestAnimationFrame(draw)
      }
    }

    const requestDraw = () => {
      if (!animationFrame && !document.hidden) {
        animationFrame = window.requestAnimationFrame(draw)
      }
    }

    const updatePointerPosition = () => {
      pointer.x = pointer.clientX + window.scrollX
      pointer.y = pointer.clientY + window.scrollY
    }

    const resize = () => {
      const nextPixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
      const rootFontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)
      const nextWidth = document.documentElement.clientWidth
      const nextHeight = Math.max(window.innerHeight, document.documentElement.scrollHeight, document.body.scrollHeight)

      if (nextWidth === canvasWidth && nextHeight === canvasHeight && nextPixelRatio === pixelRatio) {
        return
      }

      const widthRatio = canvasWidth ? nextWidth / canvasWidth : 1
      const heightRatio = canvasHeight ? nextHeight / canvasHeight : 1

      particles.forEach((particle) => {
        particle.x *= widthRatio
        particle.y *= heightRatio
      })

      const particleCount = getParticleCount(nextWidth, nextHeight)

      if (particles.length > particleCount) particles.length = particleCount
      while (particles.length < particleCount) {
        particles.push(createParticle(nextWidth, nextHeight))
      }

      canvasWidth = nextWidth
      canvasHeight = nextHeight
      pixelRatio = nextPixelRatio
      repulsionRadius = (rootFontSize || 16) * 7.5
      repulsionDistance = (rootFontSize || 16) * 3.5

      canvas.style.width = `${canvasWidth}px`
      canvas.style.height = `${canvasHeight}px`
      canvas.width = Math.round(canvasWidth * pixelRatio)
      canvas.height = Math.round(canvasHeight * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      updatePointerPosition()
      requestDraw()
    }

    const scheduleResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(resize, RESIZE_DELAY)
    }

    const handlePointerMove = (event) => {
      if (motionPreference.matches || event.pointerType === 'touch') return

      pointer.active = true
      pointer.clientX = event.clientX
      pointer.clientY = event.clientY
      updatePointerPosition()
      requestDraw()
    }

    const handleScroll = () => {
      if (!pointer.active) return

      updatePointerPosition()
      requestDraw()
    }

    const releasePointer = () => {
      if (!pointer.active) return

      pointer.active = false
    }

    const handlePointerOut = (event) => {
      if (!event.relatedTarget) releasePointer()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame)
        animationFrame = 0
      } else {
        requestDraw()
      }
    }

    const handleMotionPreferenceChange = () => {
      if (motionPreference.matches) releasePointer()
    }

    const resizeObserver = new ResizeObserver(scheduleResize)

    resize()
    resizeObserver.observe(document.documentElement)

    window.addEventListener('resize', scheduleResize)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerout', handlePointerOut)
    window.addEventListener('blur', releasePointer)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    motionPreference.addEventListener('change', handleMotionPreferenceChange)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(resizeTimer)
      resizeObserver.disconnect()
      window.removeEventListener('resize', scheduleResize)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerout', handlePointerOut)
      window.removeEventListener('blur', releasePointer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      motionPreference.removeEventListener('change', handleMotionPreferenceChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="particle-background"
      aria-hidden="true"
    />
  )
}

export default ParticleBackground
