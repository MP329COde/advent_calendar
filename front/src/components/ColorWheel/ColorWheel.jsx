import { useRef, useState } from 'react'
import { hexToHsl, hslToHex } from './colorUtils'
import './ColorWheel.css'

/**
 * Roue chromatique HSL sans dépendance : l'angle donne la teinte, la
 * distance au centre la saturation, un curseur séparé pilote la luminosité.
 */
function ColorWheel({ value, onChange }) {
  const wheelRef = useRef(null)
  const { h, s, l } = hexToHsl(value)
  const [dragging, setDragging] = useState(false)

  function updateFromPointer(event) {
    const wheel = wheelRef.current
    if (!wheel) return

    const rect = wheel.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = event.clientX - cx
    const dy = event.clientY - cy
    const radius = rect.width / 2

    const distance = Math.min(Math.hypot(dx, dy), radius)
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    const nextHue = (angle + 360) % 360
    const nextSat = (distance / radius) * 100

    onChange(hslToHex(nextHue, nextSat, l))
  }

  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    updateFromPointer(event)
  }

  function handlePointerMove(event) {
    if (!dragging) return
    updateFromPointer(event)
  }

  function handlePointerUp() {
    setDragging(false)
  }

  function handleLightnessChange(event) {
    onChange(hslToHex(h, s, Number(event.target.value)))
  }

  const angleRad = (h * Math.PI) / 180
  const pointerDistance = (s / 100) * 50
  const pointerX = 50 + Math.cos(angleRad) * pointerDistance
  const pointerY = 50 + Math.sin(angleRad) * pointerDistance

  return (
    <div className="color-wheel">
      <div
        ref={wheelRef}
        className="color-wheel__wheel"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="color-wheel__pointer"
          style={{ left: `${pointerX}%`, top: `${pointerY}%`, background: value }}
        />
      </div>
      <label className="color-wheel__lightness">
        Luminosité
        <input type="range" min="0" max="100" value={l} onChange={handleLightnessChange} />
      </label>
    </div>
  )
}

export default ColorWheel
