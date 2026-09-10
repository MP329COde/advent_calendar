import { useEffect, useState } from 'react'
import { useTheme } from '../../../theme/useTheme'

const COLOR_LABELS = {
  primary: 'Primaire',
  secondary: 'Secondaire',
  accent: 'Accent',
  background: 'Fond',
  surface: 'Surface',
  text: 'Texte',
  muted: 'Texte discret',
}

function ThemeManager() {
  const { theme: activeTheme, refresh } = useTheme()
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busySlug, setBusySlug] = useState(null)

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

              <div className="admin-theme-card__colors">
                {Object.entries(theme.config.colors ?? {}).map(([key, value]) => (
                  <label key={key} className="admin-color-field">
                    <span>{COLOR_LABELS[key] ?? key}</span>
                    <input
                      type="color"
                      value={value}
                      onChange={(event) => updateColor(theme, key, event.target.value)}
                    />
                  </label>
                ))}
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
