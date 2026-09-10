import { useEffect, useMemo, useState } from 'react'
import './Setup.css'

const FALLBACK_LANGUAGES = [
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'en', name: 'English', nativeName: 'English' },
]

const FALLBACK_THEMES = [
  {
    slug: 'christmas-classic',
    name: 'Noël classique',
    description: 'Thème classique de Noël',
    colors: {
      primary: '#B91C1C',
      secondary: '#166534',
      accent: '#D4AF37',
      background: '#FFFDF7',
    },
  },
]

const STEPS = [
  { key: 'welcome', label: 'Bienvenue' },
  { key: 'platform', label: 'Plateforme' },
  { key: 'theme', label: 'Thème' },
  { key: 'features', label: 'Fonctionnalités' },
  { key: 'admin', label: 'Administrateur' },
  { key: 'summary', label: 'Récapitulatif' },
]

const FEATURE_ICONS = {
  'calendar.quiz': '❓',
  'calendar.riddle': '🧩',
  'calendar.recipe': '🍪',
  'calendar.video': '🎬',
  'calendar.audio': '🎵',
  'calendar.gallery': '🖼️',
  'calendar.gift': '🎁',
  'calendar.embed': '🔗',
  'calendar.download': '📥',
  'calendar.public': '🌍',
}

const FEATURE_LABELS = {
  'calendar.quiz': 'Quiz',
  'calendar.riddle': 'Énigmes',
  'calendar.recipe': 'Recettes',
  'calendar.video': 'Vidéos',
  'calendar.audio': 'Contenus audio',
  'calendar.gallery': 'Galeries',
  'calendar.gift': 'Cadeaux',
  'calendar.embed': 'Contenus intégrés',
  'calendar.download': 'Téléchargements',
  'calendar.public': 'Calendriers publics',
}

function Setup({ onSetupComplete }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [meta, setMeta] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/setup/meta')
      .then((res) => {
        if (!res.ok) throw new Error('meta indisponible')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setMeta(data)
      })
      .catch(() => {
        if (!cancelled) setMeta(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const languages = meta?.languages?.length ? meta.languages : FALLBACK_LANGUAGES
  const themes = meta?.themes?.length ? meta.themes : FALLBACK_THEMES
  const availableFeatures = meta?.features?.length
    ? meta.features
    : Object.keys(FEATURE_LABELS).map((key) => ({ key, enabled: true, description: FEATURE_LABELS[key] }))

  const [platform, setPlatform] = useState({
    platformName: 'Calendrier de l’Avent',
    organizationName: '',
    language: 'fr',
    timezone: 'Europe/Paris',
  })

  const [themeSlug, setThemeSlug] = useState('christmas-classic')

  const [selectedFeatures, setSelectedFeatures] = useState(() => new Set())
  const [featuresInitialized, setFeaturesInitialized] = useState(false)

  if (!featuresInitialized && meta?.features?.length) {
    setSelectedFeatures(new Set(meta.features.filter((f) => f.enabled).map((f) => f.key)))
    setFeaturesInitialized(true)
  }

  const [admin, setAdmin] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.slug === themeSlug) ?? themes[0],
    [themes, themeSlug]
  )

  function handlePlatformChange(event) {
    const { name, value } = event.target
    setPlatform((prev) => ({ ...prev, [name]: value }))
  }

  function handleAdminChange(event) {
    const { name, value } = event.target
    setAdmin((prev) => ({ ...prev, [name]: value }))
  }

  function toggleFeature(key) {
    setSelectedFeatures((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function goNext() {
    setError(null)

    if (STEPS[stepIndex].key === 'platform') {
      if (platform.platformName.trim() === '' || platform.organizationName.trim() === '') {
        setError('Merci de renseigner le nom de la plateforme et de l’organisation')
        return
      }
    }

    setDirection('forward')
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1))
  }

  function goBack() {
    setError(null)
    setDirection('backward')
    setStepIndex((index) => Math.max(index - 1, 0))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (admin.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (admin.password !== admin.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: platform.platformName,
          organizationName: platform.organizationName,
          language: platform.language,
          timezone: platform.timezone,
          themeSlug,
          features: Array.from(selectedFeatures),
          admin: {
            name: admin.name,
            email: admin.email,
            password: admin.password,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Impossible de finaliser la configuration')
      }

      setSuccess(true)
      setTimeout(() => {
        onSetupComplete?.(data)
      }, 1800)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const currentStep = STEPS[stepIndex]
  const progressPercent = Math.round(((stepIndex + 1) / STEPS.length) * 100)

  if (success) {
    return (
      <div className="setup">
        <div className="setup__snow" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="setup__snowflake" style={{ '--i': i }}>
              ❄
            </span>
          ))}
        </div>
        <div className="setup__card setup__card--success">
          <div className="setup__success-icon">🎄</div>
          <h1>Configuration terminée !</h1>
          <p>
            {platform.platformName || 'Votre plateforme'} est prête. Redirection vers
            l’administration…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="setup">
      <div className="setup__card">
        <div className="setup__progress-track">
          <div
            className="setup__progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <ol className="setup__steps" aria-label="Étapes de configuration">
          {STEPS.map((step, index) => (
            <li
              key={step.key}
              className={
                index === stepIndex
                  ? 'setup__step is-active'
                  : index < stepIndex
                    ? 'setup__step is-done'
                    : 'setup__step'
              }
            >
              <span className="setup__step-dot">{index < stepIndex ? '✓' : index + 1}</span>
              <span className="setup__step-label">{step.label}</span>
            </li>
          ))}
        </ol>

        {error && <p className="setup__error">{error}</p>}

        <div
          key={currentStep.key}
          className={
            direction === 'forward'
              ? 'setup__panel setup__panel--enter-forward'
              : 'setup__panel setup__panel--enter-backward'
          }
        >
          {currentStep.key === 'welcome' && (
            <div className="setup__welcome">
              <div className="setup__welcome-icon">🎅</div>
              <h1>Bienvenue !</h1>
              <p>
                Configurons ensemble votre calendrier de l’Avent numérique en quelques
                étapes : identité de la plateforme, thème visuel, fonctionnalités et
                compte administrateur.
              </p>
              <button type="button" className="setup__primary" onClick={goNext}>
                Commencer la configuration
              </button>
            </div>
          )}

          {currentStep.key === 'platform' && (
            <form
              className="setup__form"
              onSubmit={(event) => {
                event.preventDefault()
                goNext()
              }}
            >
              <h2>Informations de la plateforme</h2>
              <label>
                Nom de la plateforme
                <input
                  type="text"
                  name="platformName"
                  value={platform.platformName}
                  onChange={handlePlatformChange}
                  required
                />
              </label>

              <label>
                Nom de l’organisation
                <input
                  type="text"
                  name="organizationName"
                  value={platform.organizationName}
                  onChange={handlePlatformChange}
                  autoComplete="organization"
                  required
                />
              </label>

              <label>
                Langue
                <select name="language" value={platform.language} onChange={handlePlatformChange}>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName || lang.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Fuseau horaire
                <input
                  type="text"
                  name="timezone"
                  value={platform.timezone}
                  onChange={handlePlatformChange}
                  required
                />
              </label>

              <div className="setup__actions">
                <button type="button" onClick={goBack}>
                  Retour
                </button>
                <button type="submit" className="setup__primary">
                  Suivant
                </button>
              </div>
            </form>
          )}

          {currentStep.key === 'theme' && (
            <div className="setup__form">
              <h2>Choisissez un thème</h2>
              <p className="setup__hint">
                Les couleurs seront appliquées à votre plateforme et à votre calendrier.
              </p>

              <div className="setup__theme-grid">
                {themes.map((theme) => (
                  <button
                    type="button"
                    key={theme.slug}
                    className={
                      theme.slug === themeSlug
                        ? 'setup__theme-card is-selected'
                        : 'setup__theme-card'
                    }
                    onClick={() => setThemeSlug(theme.slug)}
                  >
                    <span className="setup__theme-swatches">
                      <span
                        className="setup__swatch"
                        style={{ background: theme.colors?.primary }}
                      />
                      <span
                        className="setup__swatch"
                        style={{ background: theme.colors?.secondary }}
                      />
                      <span
                        className="setup__swatch"
                        style={{ background: theme.colors?.accent }}
                      />
                    </span>
                    <span className="setup__theme-name">{theme.name}</span>
                    <span className="setup__theme-description">{theme.description}</span>
                  </button>
                ))}
              </div>

              <div
                className="setup__theme-preview"
                style={{
                  background: selectedTheme?.colors?.background,
                  borderColor: selectedTheme?.colors?.accent,
                }}
              >
                <span
                  className="setup__theme-preview-badge"
                  style={{ background: selectedTheme?.colors?.primary }}
                >
                  Aperçu
                </span>
                <div
                  className="setup__theme-preview-card"
                  style={{
                    background: selectedTheme?.colors?.secondary,
                    color: selectedTheme?.colors?.background,
                  }}
                >
                  24
                </div>
              </div>

              <div className="setup__actions">
                <button type="button" onClick={goBack}>
                  Retour
                </button>
                <button type="button" className="setup__primary" onClick={goNext}>
                  Suivant
                </button>
              </div>
            </div>
          )}

          {currentStep.key === 'features' && (
            <div className="setup__form">
              <h2>Fonctionnalités du calendrier</h2>
              <p className="setup__hint">
                Sélectionnez les types de contenus disponibles pour vos cases.
              </p>

              <div className="setup__features-grid">
                {availableFeatures.map((feature) => {
                  const isSelected = selectedFeatures.has(feature.key)
                  return (
                    <button
                      type="button"
                      key={feature.key}
                      className={
                        isSelected
                          ? 'setup__feature-card is-selected'
                          : 'setup__feature-card'
                      }
                      onClick={() => toggleFeature(feature.key)}
                      aria-pressed={isSelected}
                    >
                      <span className="setup__feature-icon">
                        {FEATURE_ICONS[feature.key] ?? '✨'}
                      </span>
                      <span className="setup__feature-label">
                        {FEATURE_LABELS[feature.key] ?? feature.key}
                      </span>
                      <span className="setup__feature-check" aria-hidden="true">
                        {isSelected ? '✓' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="setup__actions">
                <button type="button" onClick={goBack}>
                  Retour
                </button>
                <button type="button" className="setup__primary" onClick={goNext}>
                  Suivant
                </button>
              </div>
            </div>
          )}

          {currentStep.key === 'admin' && (
            <form
              className="setup__form"
              onSubmit={(event) => {
                event.preventDefault()
                goNext()
              }}
            >
              <h2>Compte administrateur</h2>
              <label>
                Nom de l’administrateur
                <input
                  type="text"
                  name="name"
                  value={admin.name}
                  onChange={handleAdminChange}
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={admin.email}
                  onChange={handleAdminChange}
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Mot de passe
                <input
                  type="password"
                  name="password"
                  value={admin.password}
                  onChange={handleAdminChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label>
                Confirmation du mot de passe
                <input
                  type="password"
                  name="confirmPassword"
                  value={admin.confirmPassword}
                  onChange={handleAdminChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <div className="setup__actions">
                <button type="button" onClick={goBack}>
                  Retour
                </button>
                <button type="submit" className="setup__primary">
                  Suivant
                </button>
              </div>
            </form>
          )}

          {currentStep.key === 'summary' && (
            <form className="setup__form" onSubmit={handleSubmit}>
              <h2>Récapitulatif</h2>

              <dl className="setup__summary">
                <div>
                  <dt>Plateforme</dt>
                  <dd>{platform.platformName}</dd>
                </div>
                <div>
                  <dt>Organisation</dt>
                  <dd>{platform.organizationName}</dd>
                </div>
                <div>
                  <dt>Langue</dt>
                  <dd>
                    {languages.find((l) => l.code === platform.language)?.nativeName ||
                      platform.language}
                  </dd>
                </div>
                <div>
                  <dt>Thème</dt>
                  <dd>{selectedTheme?.name}</dd>
                </div>
                <div>
                  <dt>Fonctionnalités</dt>
                  <dd>{selectedFeatures.size} activée(s)</dd>
                </div>
                <div>
                  <dt>Administrateur</dt>
                  <dd>
                    {admin.name} ({admin.email})
                  </dd>
                </div>
              </dl>

              <div className="setup__actions">
                <button type="button" onClick={goBack} disabled={submitting}>
                  Retour
                </button>
                <button type="submit" className="setup__primary" disabled={submitting}>
                  {submitting ? 'Configuration…' : 'Terminer la configuration'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Setup
