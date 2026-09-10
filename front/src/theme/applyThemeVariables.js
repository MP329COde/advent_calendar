/**
 * Traduit une configuration de thème/branding en variables CSS appliquées
 * dynamiquement sur la racine du document. C'est le point d'entrée unique
 * qui rend l'apparence de la plateforme pilotable depuis l'Admin, sans
 * jamais toucher au code.
 */
export function applyThemeVariables({ branding, theme } = {}) {
  const root = document.documentElement
  const colors = { ...branding?.colors, ...theme?.config?.colors }
  const typography = theme?.config?.typography ?? {}
  const shape = theme?.config?.shape ?? {}
  const effects = theme?.config?.effects ?? {}
  const radius = shape.radius

  const mapping = {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-tertiary': colors.accent,
    '--color-background': colors.background,
    '--color-surface': colors.surface,
    '--color-surface-dim': colors.surface,
    '--color-surface-bright': colors.surface,
    '--color-surface-container-lowest': colors.background,
    '--color-surface-container-low': colors.surface,
    '--color-surface-container': colors.surface,
    '--color-surface-container-high': colors.surface,
    '--color-surface-container-highest': colors.surface,
    '--color-on-surface': colors.text,
    '--color-on-surface-variant': colors.muted,
    '--color-on-background': colors.text,
    '--font-body': typography.fontFamily && `${typography.fontFamily}, system-ui, sans-serif`,
    '--font-display': typography.headingFontFamily && `${typography.headingFontFamily}, Georgia, serif`,
    '--radius-sm': radius != null && `${Math.round(radius * 0.35)}px`,
    '--radius': radius != null && `${Math.round(radius * 0.6)}px`,
    '--radius-md': radius != null && `${radius}px`,
    '--radius-lg': radius != null && `${Math.round(radius * 1.3)}px`,
    '--radius-xl': radius != null && `${Math.round(radius * 1.8)}px`,
    '--shadow-1': effects.shadows === false ? 'none' : undefined,
    '--shadow-2': effects.shadows === false ? 'none' : undefined,
    '--shadow-glow': effects.glow && colors.primary ? `0 0 24px ${colors.primary}66` : 'none',
  }

  for (const [property, value] of Object.entries(mapping)) {
    if (value !== undefined && value !== null && value !== false) {
      root.style.setProperty(property, value)
    }
  }

  root.dataset.snow = theme?.config?.animation?.snow ? 'true' : 'false'
  root.dataset.cardStyle = theme?.config?.calendar?.cardStyle ?? 'classic'

  updateFavicon(branding?.faviconUrl)
}

function updateFavicon(url) {
  if (!url) return
  let link = document.querySelector("link[rel='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = url
}
