import { useMemo } from 'react'
import './StarsOverlay.css'

const GLYPHS = ['✦', '✧', '⋆']

function makeStars(count) {
  return Array.from({ length: count }, () => ({
    glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    top: Math.random() * 60,
    left: Math.random() * 100,
    size: 8 + Math.random() * 14,
    duration: 2.5 + Math.random() * 3,
    delay: Math.random() * -6,
  }))
}

function StarsOverlay({ count = 24 }) {
  const stars = useMemo(() => makeStars(count), [count])

  return (
    <div className="stars-overlay" aria-hidden="true">
      {stars.map((star, i) => (
        <span
          key={i}
          className="stars-overlay__star"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            fontSize: `${star.size}px`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        >
          {star.glyph}
        </span>
      ))}
    </div>
  )
}

export default StarsOverlay
