export function hexToHsl(hex) {
  const clean = (hex ?? '#888888').replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, '0')

  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0)
      break
    case g:
      h = (b - r) / d + 2
      break
    default:
      h = (r - g) / d + 4
  }

  return { h: h * 60, s: s * 100, l: l * 100 }
}

function hueToRgb(p, q, t) {
  let temp = t
  if (temp < 0) temp += 1
  if (temp > 1) temp -= 1
  if (temp < 1 / 6) return p + (q - p) * 6 * temp
  if (temp < 1 / 2) return q
  if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6
  return p
}

export function hslToHex(h, s, l) {
  const hue = ((h % 360) + 360) % 360 / 360
  const sat = Math.min(100, Math.max(0, s)) / 100
  const light = Math.min(100, Math.max(0, l)) / 100

  if (sat === 0) {
    const v = Math.round(light * 255)
    const hex = v.toString(16).padStart(2, '0')
    return `#${hex}${hex}${hex}`
  }

  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat
  const p = 2 * light - q

  const r = Math.round(hueToRgb(p, q, hue + 1 / 3) * 255)
  const g = Math.round(hueToRgb(p, q, hue) * 255)
  const b = Math.round(hueToRgb(p, q, hue - 1 / 3) * 255)

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
