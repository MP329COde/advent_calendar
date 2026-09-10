import { useMemo } from 'react'
import './ConfettiOverlay.css'

const COLOR_VARS = ['--color-primary', '--color-secondary', '--color-tertiary']

function makePieces(count) {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    size: 6 + Math.random() * 6,
    duration: 6 + Math.random() * 6,
    delay: Math.random() * -12,
    drift: Math.random() * 80 - 40,
    spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360),
    colorVar: COLOR_VARS[Math.floor(Math.random() * COLOR_VARS.length)],
    ribbon: Math.random() > 0.5,
  }))
}

function ConfettiOverlay() {
  const pieces = useMemo(() => makePieces(30), [])

  return (
    <div className="confetti-overlay" aria-hidden="true">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className={piece.ribbon ? 'confetti-overlay__piece confetti-overlay__piece--ribbon' : 'confetti-overlay__piece'}
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.ribbon ? piece.size * 2.2 : piece.size}px`,
            background: `var(${piece.colorVar})`,
            animationDuration: `${piece.duration}s`,
            animationDelay: `${piece.delay}s`,
            '--drift': `${piece.drift}px`,
            '--spin': `${piece.spin}deg`,
          }}
        />
      ))}
    </div>
  )
}

export default ConfettiOverlay
