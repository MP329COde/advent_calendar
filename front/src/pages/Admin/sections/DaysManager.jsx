import { useEffect, useState } from 'react'

function DaysManager() {
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)

  function loadDays() {
    fetch('/api/admin/days', { credentials: 'include' })
      .then((res) => res.json())
      .then(setDays)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDays()
  }, [])

  async function updateDay(id, patch) {
    setDays((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
    await fetch(`/api/admin/days/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  }

  if (loading) return <p>Chargement…</p>

  return (
    <div className="admin-section">
      <h2>Jours du calendrier</h2>
      <p className="admin-section__hint">
        Personnalisez le titre et la description de chaque case du calendrier.
      </p>

      <div className="admin-days-list">
        {days.map((day) => (
          <details key={day.id} className="admin-day-item">
            <summary>
              Jour {day.day} — {day.title || 'Sans titre'}
              {!day.isEnabled && <span className="admin-badge admin-badge--muted">Désactivé</span>}
            </summary>

            <label>
              Titre
              <input
                type="text"
                value={day.title}
                onChange={(event) => updateDay(day.id, { title: event.target.value })}
              />
            </label>

            <label>
              Description
              <textarea
                value={day.description}
                onChange={(event) => updateDay(day.id, { description: event.target.value })}
              />
            </label>

            <label className="admin-inline-checkbox">
              <input
                type="checkbox"
                checked={day.isEnabled}
                onChange={(event) => updateDay(day.id, { isEnabled: event.target.checked })}
              />
              Case activée
            </label>
          </details>
        ))}
      </div>
    </div>
  )
}

export default DaysManager
