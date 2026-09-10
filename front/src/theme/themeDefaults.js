export const DEFAULT_BRANDING = {
  platformName: 'Calendrier de l’Avent',
  shortName: 'Avent',
  tagline: '',
  logoUrl: null,
  faviconUrl: null,
  colors: {
    primary: '#9b1c1c',
    secondary: '#c87512',
    accent: '#D4AF37',
    background: '#fffdf8',
    surface: '#ffffff',
    text: '#243047',
    muted: '#6f5a55',
  },
}

export const DEFAULT_THEME_CONFIG = {
  colors: DEFAULT_BRANDING.colors,
  typography: {
    fontFamily: 'system-ui',
    headingFontFamily: 'system-ui',
  },
  shape: { radius: 16 },
}
