import { useEffect, useState } from 'react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import './Login.css'

function Login() {
  useDocumentTitle()

  const [days, setDays] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/days')
      .then((res) => {
        if (!res.ok) throw new Error('Erreur lors du chargement du calendrier')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setDays(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="home">
      <section className="home__hero">
        <h1 className="text-display-hero">Calendrier de l&apos;Avent</h1>
        <p className="text-body-lg">
          Un défi, une surprise par jour : ouvrez la case du jour du 1er au 24
          décembre pour découvrir le mini-projet à relever.
        </p>
      </section>

      {error && (
        <p role="alert" className="home__error">
          {error}
        </p>
      )}

      <section className="home__grid" aria-label="Cases du calendrier">
        {days.map(({ day, unlocked, title }) => (
          <div
            key={day}
            className={
              unlocked ? 'day-card day-card--unlocked' : 'day-card'
            }
            aria-label={
              unlocked
                ? `Jour ${day}, débloqué${title ? `, ${title}` : ''}`
                : `Jour ${day}, verrouillé`
            }
          >
            <span className="text-calendar-number">{day}</span>
            {!unlocked && (
              <span className="day-card__lock" aria-hidden="true">
                🔒
              </span>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}

export default Login
