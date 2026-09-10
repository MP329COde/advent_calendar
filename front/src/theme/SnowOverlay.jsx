import { useMemo } from 'react'
import './SnowOverlay.css'

const GLYPHS = ['❄', '❅', '❆']

function makeFlakes(count, scale) {
  return Array.from({ length: count }, (_, i) => {
    const layer = i % 3 // 0 = far/small, 1 = mid, 2 = near/large
    const size = (layer === 0 ? 10 + Math.random() * 6 : layer === 1 ? 16 + Math.random() * 8 : 24 + Math.random() * 10) * scale

    return {
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      left: Math.random() * 100,
      size,
      duration: layer === 0 ? 18 + Math.random() * 8 : layer === 1 ? 12 + Math.random() * 6 : 8 + Math.random() * 5,
      delay: Math.random() * -20,
      drift: Math.random() * 60 - 30,
      spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
      opacity: layer === 0 ? 0.35 + Math.random() * 0.2 : layer === 1 ? 0.55 + Math.random() * 0.2 : 0.75 + Math.random() * 0.25,
    }
  })
}

const MIN_COUNT = 6
const MAX_COUNT = 120
const MIN_SCALE = 0.4
const MAX_SCALE = 2.5

function SnowOverlay({ density = 36, size = 1 }) {
  const count = Math.round(Math.min(MAX_COUNT, Math.max(MIN_COUNT, density)))
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, size))
  const flakes = useMemo(() => makeFlakes(count, scale), [count, scale])

  return (
    <div className="snow-overlay" aria-hidden="true">
      {flakes.map((flake, i) => (
        <span
          key={i}
          className="snow-overlay__flake"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.size}px`,
            opacity: flake.opacity,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            '--drift': `${flake.drift}px`,
            '--spin': `${flake.spin}deg`,
          }}
        >
          {flake.glyph}
        </span>
      ))}
    </div>
  )
}

export default SnowOverlay
