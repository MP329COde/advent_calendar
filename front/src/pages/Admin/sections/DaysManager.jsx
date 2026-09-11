import { useEffect, useState } from 'react'

function DaysManager() {
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState(null)
  const [error, setError] = useState(null)

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

  async function uploadFile(dayId, file, field) {
    setUploadingId(`${dayId}:${field}`)
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
      await updateDay(dayId, { [field]: url })
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingId(null)
    }
  }

  if (loading) return <p>Chargement…</p>

  return (
    <div className="admin-section">
      <h2>Jours du calendrier</h2>
      <p className="admin-section__hint">
        Personnalisez le titre et la description de chaque case du calendrier.
      </p>

      {error && <p className="admin-section__error">{error}</p>}

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

            <label>
              Date de déverrouillage
              <input
                type="date"
                value={day.unlockDate ?? ''}
                onChange={(event) => updateDay(day.id, { unlockDate: event.target.value })}
              />
            </label>

            <label>
              Heure de déverrouillage (UTC)
              <input
                type="time"
                value={day.unlockTime ?? '00:00'}
                onChange={(event) => updateDay(day.id, { unlockTime: event.target.value })}
              />
            </label>

            <label>
              Lien externe
              <input
                type="url"
                placeholder="https://…"
                value={day.linkUrl ?? ''}
                onChange={(event) => updateDay(day.id, { linkUrl: event.target.value || null })}
              />
            </label>

            <label>
              Code promo
              <input
                type="text"
                placeholder="NOEL2026"
                value={day.promoCode ?? ''}
                onChange={(event) => updateDay(day.id, { promoCode: event.target.value || null })}
              />
            </label>

            <label>
              Question du quiz
              <input
                type="text"
                placeholder="Combien de rennes tire le traîneau du Père Noël ?"
                value={day.quizQuestion ?? ''}
                onChange={(event) => updateDay(day.id, { quizQuestion: event.target.value || null })}
              />
            </label>

            <label>
              Réponse attendue
              <input
                type="text"
                placeholder="9"
                value={day.quizAnswer ?? ''}
                onChange={(event) => updateDay(day.id, { quizAnswer: event.target.value || null })}
              />
            </label>

            <label>
              Image de la case
              <input
                type="file"
                accept="image/*"
                disabled={uploadingId === `${day.id}:imageUrl`}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) uploadFile(day.id, file, 'imageUrl')
                  event.target.value = ''
                }}
              />
            </label>
            {day.imageUrl && (
              <div className="admin-day-preview">
                <img src={day.imageUrl} alt="" className="admin-day-preview__image" />
                <button type="button" onClick={() => updateDay(day.id, { imageUrl: null })}>
                  Retirer l&apos;image
                </button>
              </div>
            )}

            <label>
              Musique de la case
              <input
                type="file"
                accept="audio/*"
                disabled={uploadingId === `${day.id}:audioUrl`}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) uploadFile(day.id, file, 'audioUrl')
                  event.target.value = ''
                }}
              />
            </label>
            {day.audioUrl && (
              <div className="admin-day-preview">
                <audio src={day.audioUrl} controls />
                <button type="button" onClick={() => updateDay(day.id, { audioUrl: null })}>
                  Retirer la musique
                </button>
              </div>
            )}
          </details>
        ))}
      </div>
    </div>
  )
}

export default DaysManager
