import { useEffect, useState } from 'react'
import { useTheme } from '../../../theme/useTheme'
import { loadDesigns } from '../../../designs/loadDesigns'
import { PALETTE_SUGGESTIONS } from '../../../designs/paletteSuggestions'
import ColorWheel from '../../../components/ColorWheel/ColorWheel'
import SnowOverlay from '../../../theme/SnowOverlay'
import { shuffleArray } from '../../../utils/shuffle'

const AVAILABLE_DESIGNS = loadDesigns()

const PAGE_MUSIC_TARGETS = [
  { key: 'home', label: 'Page d’accueil' },
  { key: 'about', label: 'Page À propos' },
]

const SHUFFLE_MODES = [
  { id: 'off', label: 'Ordre normal' },
  { id: 'auto', label: 'Mélange automatique' },
  { id: 'manual', label: 'Ordre manuel' },
]

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
  const [uploadingMosaicFor, setUploadingMosaicFor] = useState(null)
  const [uploadingMusicFor, setUploadingMusicFor] = useState(null)

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

  async function updateMosaicImage(theme, file) {
    if (!file) return
    setUploadingMosaicFor(theme.id)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Échec de l'import")
      const { url } = await res.json()
      await saveConfig(theme, {
        ...theme.config,
        calendar: { ...theme.config.calendar, backgroundImage: url },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingMosaicFor(null)
    }
  }

  async function updatePageMusicFile(theme, pageKey, file) {
    if (!file) return
    setUploadingMusicFor(`${theme.id}:${pageKey}`)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Échec de l'import")
      const { url } = await res.json()
      await saveConfig(theme, {
        ...theme.config,
        pages: {
          ...theme.config.pages,
          [pageKey]: { ...theme.config.pages?.[pageKey], musicUrl: url },
        },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingMusicFor(null)
    }
  }

  function updatePageMusicYoutube(theme, pageKey, value) {
    return saveConfig(theme, {
      ...theme.config,
      pages: {
        ...theme.config.pages,
        [pageKey]: { ...theme.config.pages?.[pageKey], musicYoutubeUrl: value },
      },
    })
  }

  function updateShuffleMode(theme, shuffle) {
    return saveConfig(theme, {
      ...theme.config,
      calendar: { ...theme.config.calendar, shuffle },
    })
  }

  function shuffleDayOrder(theme) {
    const order = shuffleArray(Array.from({ length: 24 }, (_, i) => i + 1))
    return saveConfig(theme, {
      ...theme.config,
      calendar: { ...theme.config.calendar, dayOrder: order },
    })
  }

  function moveDayInOrder(theme, index, direction) {
    const order = theme.config.calendar?.dayOrder?.length
      ? [...theme.config.calendar.dayOrder]
      : Array.from({ length: 24 }, (_, i) => i + 1)
    const target = index + direction
    if (target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target], order[index]]
    return saveConfig(theme, {
      ...theme.config,
      calendar: { ...theme.config.calendar, dayOrder: order },
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
                  <span>Disposition des cases</span>
                  <div className="admin-font-options">
                    {SHUFFLE_MODES.map((mode) => {
                      const isSelected = (theme.config.calendar?.shuffle ?? 'off') === mode.id

                      return (
                        <button
                          key={mode.id}
                          type="button"
                          className={isSelected ? 'admin-font-option is-selected' : 'admin-font-option'}
                          onClick={() => updateShuffleMode(theme, mode.id)}
                        >
                          {mode.label}
                        </button>
                      )
                    })}
                  </div>

                  {theme.config.calendar?.shuffle === 'manual' && (
                    <div className="admin-day-order">
                      <button type="button" onClick={() => shuffleDayOrder(theme)}>
                        🔀 Mélanger aléatoirement
                      </button>
                      <ol className="admin-day-order__list">
                        {(theme.config.calendar?.dayOrder?.length
                          ? theme.config.calendar.dayOrder
                          : Array.from({ length: 24 }, (_, i) => i + 1)
                        ).map((day, index, arr) => (
                          <li key={day}>
                            <span>Jour {day}</span>
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveDayInOrder(theme, index, -1)}
                              aria-label={`Monter le jour ${day}`}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={index === arr.length - 1}
                              onClick={() => moveDayInOrder(theme, index, 1)}
                              aria-label={`Descendre le jour ${day}`}
                            >
                              ↓
                            </button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                <div className="admin-style-field">
                  <span>Image mosaïque du calendrier</span>
                  <p className="admin-section__hint">
                    Une seule image est découpée automatiquement : chaque case du calendrier
                    affiche le morceau qui lui correspond.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingMosaicFor === theme.id}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      updateMosaicImage(theme, file)
                      event.target.value = ''
                    }}
                  />
                  {theme.config.calendar?.backgroundImage && (
                    <div className="admin-day-preview">
                      <img
                        src={theme.config.calendar.backgroundImage}
                        alt=""
                        className="admin-day-preview__image"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          saveConfig(theme, {
                            ...theme.config,
                            calendar: { ...theme.config.calendar, backgroundImage: null },
                          })
                        }
                      >
                        Retirer l&apos;image
                      </button>
                    </div>
                  )}
                </div>

                <div className="admin-style-field">
                  <span>Musique des pages</span>
                  <p className="admin-section__hint">
                    Une piste audio par page (fichier ou lien YouTube). La lecture démarre au
                    clic du visiteur sur le bouton 🎵, jamais automatiquement.
                  </p>
                  {PAGE_MUSIC_TARGETS.map((target) => {
                    const pageConfig = theme.config.pages?.[target.key] ?? {}
                    const uploadKey = `${theme.id}:${target.key}`

                    return (
                      <div key={target.key} className="admin-page-music">
                        <span className="admin-page-music__label">{target.label}</span>
                        <input
                          type="file"
                          accept="audio/*"
                          disabled={uploadingMusicFor === uploadKey}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            updatePageMusicFile(theme, target.key, file)
                            event.target.value = ''
                          }}
                        />
                        {pageConfig.musicUrl && (
                          <div className="admin-day-preview">
                            <audio src={pageConfig.musicUrl} controls />
                            <button
                              type="button"
                              onClick={() =>
                                saveConfig(theme, {
                                  ...theme.config,
                                  pages: {
                                    ...theme.config.pages,
                                    [target.key]: { ...pageConfig, musicUrl: null },
                                  },
                                })
                              }
                            >
                              Retirer
                            </button>
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder="ou un lien YouTube (https://youtube.com/watch?v=...)"
                          defaultValue={pageConfig.musicYoutubeUrl ?? ''}
                          onBlur={(event) =>
                            updatePageMusicYoutube(theme, target.key, event.target.value)
                          }
                        />
                      </div>
                    )
                  })}
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
                    {theme.config.animation?.snow && (
                      <div className="admin-snow-tuning">
                        <label className="admin-range-field">
                          <span>Quantité de flocons ({theme.config.animation?.snowDensity ?? 36})</span>
                          <input
                            type="range"
                            min={6}
                            max={120}
                            step={2}
                            value={theme.config.animation?.snowDensity ?? 36}
                            onChange={(event) =>
                              toggleAnimation(theme, 'snowDensity', Number(event.target.value))
                            }
                          />
                        </label>
                        <label className="admin-range-field">
                          <span>Taille des flocons ({(theme.config.animation?.snowSize ?? 1).toFixed(1)}×)</span>
                          <input
                            type="range"
                            min={0.4}
                            max={2.5}
                            step={0.1}
                            value={theme.config.animation?.snowSize ?? 1}
                            onChange={(event) =>
                              toggleAnimation(theme, 'snowSize', Number(event.target.value))
                            }
                          />
                        </label>
                        <div className="admin-snow-preview">
                          <SnowOverlay
                            density={theme.config.animation?.snowDensity ?? 36}
                            size={theme.config.animation?.snowSize ?? 1}
                          />
                        </div>
                      </div>
                    )}
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
