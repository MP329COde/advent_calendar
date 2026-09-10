import { useEffect, useState } from 'react'
import './DayModal.css'

function DayModal({ day, onClose }) {
  const [content, setContent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch(`/api/days/${day}`)
      .then((res) => {
        if (!res.ok) throw new Error("Cette case n'a pas pu être ouverte")
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setContent(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [day])

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="day-modal__backdrop" onClick={onClose} role="presentation">
      <div
        className="day-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Contenu du jour ${day}`}
        data-testid="day-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="day-modal__close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        {error && (
          <p role="alert" className="day-modal__error">
            {error}
          </p>
        )}

        {!error && !content && <p className="day-modal__loading">Ouverture de la case…</p>}

        {content && (
          <div className="day-modal__content" data-testid="day-modal-content">
            <span className="day-modal__day">Jour {content.day}</span>
            <h2>{content.title || `Case ${content.day}`}</h2>

            {content.imageUrl && (
              <img
                className="day-modal__image"
                src={content.imageUrl}
                alt=""
                data-testid="day-modal-image"
              />
            )}

            {content.description && <p className="day-modal__description">{content.description}</p>}

            {content.audioUrl && (
              <audio
                className="day-modal__audio"
                src={content.audioUrl}
                controls
                autoPlay
                data-testid="day-modal-audio"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DayModal
