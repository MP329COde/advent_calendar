import { useMemo } from 'react'
import './LightsGarland.css'

const BULB_COLORS = ['#e63946', '#2a9d8f', '#f4a261', '#457b9d', '#e9c46a']

function makeBulbs(count) {
  return Array.from({ length: count }, (_, i) => ({
    color: BULB_COLORS[i % BULB_COLORS.length],
    delay: (i % BULB_COLORS.length) * 0.3,
  }))
}

function LightsGarland() {
  const bulbs = useMemo(() => makeBulbs(24), [])

  return (
    <div className="lights-garland" aria-hidden="true">
      <div className="lights-garland__wire" />
      <div className="lights-garland__bulbs">
        {bulbs.map((bulb, i) => (
          <span
            key={i}
            className="lights-garland__bulb"
            style={{ '--bulb-color': bulb.color, animationDelay: `${bulb.delay}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export default LightsGarland
