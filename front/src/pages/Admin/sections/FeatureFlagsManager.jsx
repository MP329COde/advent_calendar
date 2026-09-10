import { useEffect, useState } from 'react'

function FeatureFlagsManager() {
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/features', { credentials: 'include' })
      .then((res) => res.json())
      .then(setFlags)
      .finally(() => setLoading(false))
  }, [])

  async function toggle(key, enabled) {
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled } : f)))
    await fetch(`/api/admin/features/${key}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
  }

  if (loading) return <p>Chargement…</p>

  return (
    <div className="admin-section">
      <h2>Fonctionnalités</h2>
      <p className="admin-section__hint">
        Activez ou désactivez les fonctionnalités disponibles sur la plateforme.
      </p>

      <ul className="admin-flag-list">
        {flags.map((flag) => (
          <li key={flag.key} className="admin-flag-item">
            <div>
              <strong>{flag.key}</strong>
              <p>{flag.description}</p>
            </div>
            <label className="admin-switch">
              <input
                type="checkbox"
                checked={flag.enabled}
                onChange={(event) => toggle(flag.key, event.target.checked)}
              />
              <span />
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FeatureFlagsManager
