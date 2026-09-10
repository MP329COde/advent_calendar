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

  const mapping = {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-tertiary': colors.accent,
    '--color-background': colors.background,
    '--color-surface': colors.surface,
    '--color-on-surface': colors.text,
    '--color-on-surface-variant': colors.muted,
    '--color-on-background': colors.text,
    '--font-body': typography.fontFamily && `${typography.fontFamily}, system-ui, sans-serif`,
    '--font-display': typography.headingFontFamily && `${typography.headingFontFamily}, Georgia, serif`,
    '--radius-lg': shape.radius != null && `${shape.radius}px`,
  }

  for (const [property, value] of Object.entries(mapping)) {
    if (value) {
      root.style.setProperty(property, value)
    }
  }

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
