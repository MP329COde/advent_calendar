import { useCallback, useEffect, useMemo, useState } from 'react'
import ThemeContext from './ThemeContext'
import { applyThemeVariables } from './applyThemeVariables'
import { DEFAULT_BRANDING, DEFAULT_THEME_CONFIG } from './themeDefaults'

function ThemeProvider({ children }) {
  const [branding, setBranding] = useState(null)
  const [theme, setTheme] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [brandingRes, themeRes] = await Promise.all([
        fetch('/api/branding'),
        fetch('/api/themes/active'),
      ])

      const brandingData = brandingRes.ok ? await brandingRes.json() : DEFAULT_BRANDING
      const themeData = themeRes.ok ? await themeRes.json() : { config: DEFAULT_THEME_CONFIG }

      setBranding(brandingData)
      setTheme(themeData)
      applyThemeVariables({ branding: brandingData, theme: themeData })
    } catch {
      setBranding(DEFAULT_BRANDING)
      setTheme({ config: DEFAULT_THEME_CONFIG })
      applyThemeVariables({ branding: DEFAULT_BRANDING, theme: { config: DEFAULT_THEME_CONFIG } })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetch('/api/branding'), fetch('/api/themes/active')])
      .then(async ([brandingRes, themeRes]) => {
        const brandingData = brandingRes.ok ? await brandingRes.json() : DEFAULT_BRANDING
        const themeData = themeRes.ok ? await themeRes.json() : { config: DEFAULT_THEME_CONFIG }
        setBranding(brandingData)
        setTheme(themeData)
        applyThemeVariables({ branding: brandingData, theme: themeData })
      })
      .catch(() => {
        setBranding(DEFAULT_BRANDING)
        setTheme({ config: DEFAULT_THEME_CONFIG })
        applyThemeVariables({ branding: DEFAULT_BRANDING, theme: { config: DEFAULT_THEME_CONFIG } })
      })
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo(
    () => ({ branding, theme, loading, refresh: load }),
    [branding, theme, loading, load]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
