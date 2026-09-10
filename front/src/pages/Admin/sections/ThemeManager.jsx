import { useEffect, useState } from 'react'
import { useTheme } from '../../../theme/useTheme'
import { loadDesigns } from '../../../designs/loadDesigns'
import { PALETTE_SUGGESTIONS } from '../../../designs/paletteSuggestions'
import ColorWheel from '../../../components/ColorWheel/ColorWheel'

const AVAILABLE_DESIGNS = loadDesigns()

const COLOR_LABELS = {
  primary: 'Primaire',
  secondary: 'Secondaire',
  accent: 'Accent',
  background: 'Fond',
  surface: 'Surface',
  text: 'Texte',
  muted: 'Texte discret',
}

const FONT_PAIRINGS = [
  {
    id: 'nocturne',
    label: 'Nocturne (élégant)',
    fontFamily: 'Plus Jakarta Sans',
    headingFontFamily: 'Playfair Display',
  },
  {
    id: 'chaleureux',
    label: 'Chaleureux',
    fontFamily: 'Inter',
    headingFontFamily: 'Fraunces',
  },
  {
    id: 'code',
    label: 'Atelier de code',
    fontFamily: 'Inter',
    headingFontFamily: 'Space Grotesk',
  },
  {
    id: 'festif',
    label: 'Festif rond',
    fontFamily: 'Poppins',
    headingFontFamily: 'Poppins',
  },
]

const RADIUS_PRESETS = [
  { id: 'sharp', label: 'Anguleux', value: 4 },
  { id: 'soft', label: 'Adouci', value: 16 },
  { id: 'round', label: 'Arrondi', value: 28 },
]

const CARD_STYLES = [
  { id: 'classic', label: 'Classique' },
  { id: 'ticket', label: 'Porte d’avent' },
]

function ThemeManager() {
  const { theme: activeTheme, refresh } = useTheme()
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busySlug, setBusySlug] = useState(null)
  const [importingDesign, setImportingDesign] = useState(null)
  const [wheelFor, setWheelFor] = useState(null)

  async function loadThemes() {
    try {
      const res = await fetch('/api/themes?all=1', { credentials: 'include' })
      if (!res.ok) throw new Error('Impossible de charger les thèmes')
      setThemes(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/themes?all=1', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Impossible de charger les thèmes'))))
      .then(setThemes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function activateTheme(id) {
    setBusySlug(id)
    setError(null)
    try {
      const res = await fetch(`/api/themes/${id}/activate`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await Promise.all([loadThemes(), refresh()])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusySlug(null)
    }
  }

  async function updateColor(theme, key, value) {
    const nextConfig = {
      ...theme.config,
      colors: { ...theme.config.colors, [key]: value },
    }

    setThemes((prev) => prev.map((t) => (t.id === theme.id ? { ...t, config: nextConfig } : t)))

    const res = await fetch(`/api/themes/${theme.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: nextConfig }),
    })

    if (res.ok && theme.id === activeTheme?.id) {
      refresh()
    }
  }

  async function applyPalette(theme, palette) {
    const nextConfig = {
      ...theme.config,
      colors: { ...theme.config.colors, ...palette.colors },
    }

    setThemes((prev) => prev.map((t) => (t.id === theme.id ? { ...t, config: nextConfig } : t)))

    const res = await fetch(`/api/themes/${theme.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: nextConfig }),
    })

    if (res.ok && theme.id === activeTheme?.id) {
      refresh()
    }
  }

  async function saveConfig(theme, nextConfig) {
    setThemes((prev) => prev.map((t) => (t.id === theme.id ? { ...t, config: nextConfig } : t)))

    const res = await fetch(`/api/themes/${theme.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: nextConfig }),
    })

    if (res.ok && theme.id === activeTheme?.id) {
      refresh()
    }
  }

  function updateTypography(theme, pairing) {
    return saveConfig(theme, {
      ...theme.config,
      typography: { fontFamily: pairing.fontFamily, headingFontFamily: pairing.headingFontFamily },
    })
  }

  function updateRadius(theme, radius) {
    return saveConfig(theme, {
      ...theme.config,
      shape: { ...theme.config.shape, radius },
    })
  }

  function updateCardStyle(theme, cardStyle) {
    return saveConfig(theme, {
      ...theme.config,
      calendar: { ...theme.config.calendar, cardStyle },
    })
  }

  function toggleEffect(theme, key, value) {
    return saveConfig(theme, {
      ...theme.config,
      effects: { ...theme.config.effects, [key]: value },
    })
  }

  function toggleAnimation(theme, key, value) {
    return saveConfig(theme, {
      ...theme.config,
      animation: { ...theme.config.animation, [key]: value },
    })
  }

  async function deleteTheme(id) {
    setError(null)
    const res = await fetch(`/api/themes/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok && res.status !== 204) {
      setError((await res.json()).error)
      return
    }
    loadThemes()
  }

  async function createTheme(event) {
    event.preventDefault()
    const name = event.target.elements.name.value.trim()
    if (!name) return

    const res = await fetch('/api/themes', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: '',
        config: activeTheme?.config ?? {},
      }),
    })

    if (res.ok) {
      event.target.reset()
      loadThemes()
    }
  }

  async function importDesign(design) {
    setImportingDesign(design.folder)
    setError(null)
    try {
      const themeRes = await fetch('/api/themes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: design.name,
          description: design.description,
          config: design.config,
        }),
      })
      if (!themeRes.ok) throw new Error((await themeRes.json()).error)

      if (design.branding) {
        await fetch('/api/branding', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(design.branding),
        })
      }

      await loadThemes()
    } catch (err) {
      setError(err.message)
    } finally {
      setImportingDesign(null)
    }
  }

  if (loading) return <p>Chargement des thèmes…</p>

  return (
    <div className="admin-section">
      <h2>Thèmes</h2>
      <p className="admin-section__hint">
        Créez et personnalisez les palettes de couleurs de la plateforme. Le thème actif est
        appliqué immédiatement sur tout le site.
      </p>

      {error && <p className="admin-section__error">{error}</p>}

      <form className="admin-theme-create" onSubmit={createTheme}>
        <input name="name" type="text" placeholder="Nom du nouveau thème" required />
        <button type="submit">Créer un thème</button>
      </form>

      {AVAILABLE_DESIGNS.length > 0 && (
        <div className="admin-design-library">
          <h3>Bibliothèque de designs</h3>
          <p className="admin-section__hint">
            Designs déposés dans <code>front/src/designs/</code>. Importer une copie crée un
            nouveau thème (et met à jour le branding si le design en définit un).
          </p>
          <div className="admin-design-grid">
            {AVAILABLE_DESIGNS.map((design) => (
              <div key={design.folder} className="admin-design-card">
                {design.branding?.logoUrl && (
                  <img className="admin-design-card__logo" src={design.branding.logoUrl} alt="" />
                )}
                <h4>{design.name}</h4>
                {design.description && <p>{design.description}</p>}
                <button
                  type="button"
                  onClick={() => importDesign(design)}
                  disabled={importingDesign === design.folder}
                >
                  {importingDesign === design.folder ? 'Import…' : 'Importer comme thème'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-theme-grid">
        {themes.map((theme) => {
          const isActive = theme.id === activeTheme?.id

          return (
            <div
              key={theme.id}
              className={isActive ? 'admin-theme-card is-active' : 'admin-theme-card'}
            >
              <div className="admin-theme-card__header">
                <h3>{theme.name}</h3>
                {isActive && <span className="admin-badge">Actif</span>}
              </div>
              <p className="admin-theme-card__description">{theme.description}</p>

              <div className="admin-palette-suggestions">
                {PALETTE_SUGGESTIONS.map((palette) => (
                  <button
                    key={palette.name}
                    type="button"
                    className="admin-palette-swatch"
                    title={palette.name}
                    onClick={() => applyPalette(theme, palette)}
                    style={{
                      background: `linear-gradient(135deg, ${palette.colors.primary}, ${palette.colors.secondary}, ${palette.colors.accent})`,
                    }}
                  />
                ))}
              </div>

              <div className="admin-theme-card__colors">
                {Object.entries(theme.config.colors ?? {}).map(([key, value]) => {
                  const wheelKey = `${theme.id}:${key}`
                  const isWheelOpen = wheelFor === wheelKey

                  return (
                    <div key={key} className="admin-color-field">
                      <label>
                        <span>{COLOR_LABELS[key] ?? key}</span>
                        <input
                          type="color"
                          value={value}
                          onChange={(event) => updateColor(theme, key, event.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="admin-color-wheel-toggle"
                        onClick={() => setWheelFor(isWheelOpen ? null : wheelKey)}
                      >
                        {isWheelOpen ? 'Fermer' : '🎨 Roue'}
                      </button>
                      {isWheelOpen && (
                        <ColorWheel
                          value={value}
                          onChange={(nextValue) => updateColor(theme, key, nextValue)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="admin-theme-card__style">
                <div className="admin-style-field">
                  <span>Typographie</span>
                  <div className="admin-font-options">
                    {FONT_PAIRINGS.map((pairing) => {
                      const isSelected =
                        theme.config.typography?.headingFontFamily === pairing.headingFontFamily &&
                        theme.config.typography?.fontFamily === pairing.fontFamily

                      return (
                        <button
                          key={pairing.id}
                          type="button"
                          className={isSelected ? 'admin-font-option is-selected' : 'admin-font-option'}
                          style={{ fontFamily: `${pairing.headingFontFamily}, serif` }}
                          onClick={() => updateTypography(theme, pairing)}
                        >
                          {pairing.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="admin-style-field">
                  <span>Forme des coins</span>
                  <div className="admin-radius-options">
                    {RADIUS_PRESETS.map((preset) => {
                      const isSelected = theme.config.shape?.radius === preset.value

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          className={isSelected ? 'admin-radius-option is-selected' : 'admin-radius-option'}
                          onClick={() => updateRadius(theme, preset.value)}
                        >
                          <span
                            className="admin-radius-preview"
                            style={{ borderRadius: `${preset.value}px` }}
                          />
                          {preset.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="admin-style-field">
                  <span>Style des cases du calendrier</span>
                  <div className="admin-font-options">
                    {CARD_STYLES.map((style) => {
                      const isSelected = (theme.config.calendar?.cardStyle ?? 'classic') === style.id

                      return (
                        <button
                          key={style.id}
                          type="button"
                          className={isSelected ? 'admin-font-option is-selected' : 'admin-font-option'}
                          onClick={() => updateCardStyle(theme, style.id)}
                        >
                          {style.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="admin-style-field">
                  <span>Effets et animations</span>
                  <div className="admin-effect-toggles">
                    <label className="admin-effect-toggle">
                      <input
                        type="checkbox"
                        checked={theme.config.effects?.shadows !== false}
                        onChange={(event) => toggleEffect(theme, 'shadows', event.target.checked)}
                      />
                      Ombres portées
                    </label>
                    <label className="admin-effect-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(theme.config.effects?.glow)}
                        onChange={(event) => toggleEffect(theme, 'glow', event.target.checked)}
                      />
                      Lueur sur les cases débloquées
                    </label>
                    <label className="admin-effect-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(theme.config.animation?.snow)}
                        onChange={(event) => toggleAnimation(theme, 'snow', event.target.checked)}
                      />
                      Neige animée
                    </label>
                    <label className="admin-effect-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(theme.config.animation?.stars)}
                        onChange={(event) => toggleAnimation(theme, 'stars', event.target.checked)}
                      />
                      Étoiles scintillantes
                    </label>
                    <label className="admin-effect-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(theme.config.animation?.lights)}
                        onChange={(event) => toggleAnimation(theme, 'lights', event.target.checked)}
                      />
                      Guirlande lumineuse
                    </label>
                    <label className="admin-effect-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(theme.config.animation?.confetti)}
                        onChange={(event) => toggleAnimation(theme, 'confetti', event.target.checked)}
                      />
                      Confettis festifs
                    </label>
                  </div>
                </div>
              </div>

              <div className="admin-theme-card__actions">
                <button
                  type="button"
                  onClick={() => activateTheme(theme.id)}
                  disabled={isActive || busySlug === theme.id}
                >
                  {isActive ? 'Thème actif' : 'Activer'}
                </button>
                {!isActive && (
                  <button type="button" className="admin-btn-danger" onClick={() => deleteTheme(theme.id)}>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ThemeManager
