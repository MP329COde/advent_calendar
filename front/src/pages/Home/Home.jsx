import { useEffect, useMemo, useState } from 'react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useTheme } from '../../theme/useTheme'
import PageMusicPlayer from '../../theme/PageMusicPlayer'
import { shuffleArray } from '../../utils/shuffle'
import { buildRemindersIcs } from '../../utils/ics'
import DayModal from './DayModal'
import './Home.css'

const DESKTOP_COLS = 6
const MOBILE_COLS = 4
const MOBILE_QUERY = '(max-width: 767px)'

function useColumnCount() {
  const [cols, setCols] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
      ? MOBILE_COLS
      : DESKTOP_COLS
  )

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const handler = (event) => setCols(event.matches ? MOBILE_COLS : DESKTOP_COLS)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return cols
}

function mosaicStyle(index, cols, rows, imageUrl) {
  if (!imageUrl) return undefined
  const col = index % cols
  const row = Math.floor(index / cols)
  const x = cols > 1 ? (col / (cols - 1)) * 100 : 50
  const y = rows > 1 ? (row / (rows - 1)) * 100 : 50

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${x}% ${y}%`,
  }
}

function Home() {
  useDocumentTitle()
  const { theme } = useTheme() ?? {}

  const [days, setDays] = useState([])
  const [error, setError] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const cols = useColumnCount()

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

  const mosaicImage = theme?.config?.calendar?.backgroundImage ?? null
  const shuffleMode = theme?.config?.calendar?.shuffle ?? 'off'
  const manualOrder = theme?.config?.calendar?.dayOrder

  const orderedDays = useMemo(() => {
    if (shuffleMode === 'manual' && Array.isArray(manualOrder) && manualOrder.length) {
      const byDay = new Map(days.map((d) => [d.day, d]))
      const ordered = manualOrder.map((day) => byDay.get(day)).filter(Boolean)
      const missing = days.filter((d) => !manualOrder.includes(d.day))
      return [...ordered, ...missing]
    }

    if (shuffleMode === 'auto') {
      return shuffleArray(days)
    }

    return days
  }, [days, shuffleMode, manualOrder])

  const rows = Math.ceil(orderedDays.length / cols) || 1

  function openDay(day, unlocked) {
    if (!unlocked) return
    setSelectedDay(day)
  }

  function downloadReminders() {
    const ics = buildRemindersIcs(days)
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'calendrier-avent-rappels.ics'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="home">
      <PageMusicPlayer pageKey="home" />
      <section className="home__hero">
        <h1 className="text-display-hero">Calendrier de l&apos;Avent</h1>
        <p className="text-body-lg">
          Un défi, une surprise par jour : ouvrez la case du jour du 1er au 24
          décembre pour découvrir le mini-projet à relever.
        </p>
        {days.length > 0 && (
          <button
            type="button"
            className="home__reminders-btn"
            data-testid="download-reminders"
            onClick={downloadReminders}
          >
            📅 Ajouter les rappels au calendrier
          </button>
        )}
      </section>

      {error && (
        <p role="alert" className="home__error">
          {error}
        </p>
      )}

      <section className="home__grid" aria-label="Cases du calendrier">
        {orderedDays.map(({ day, unlocked, title }, index) => (
          <button
            key={day}
            type="button"
            className={unlocked ? 'day-card day-card--unlocked' : 'day-card'}
            style={mosaicStyle(index, cols, rows, mosaicImage)}
            onClick={() => openDay(day, unlocked)}
            disabled={!unlocked}
            data-testid="day-card"
            data-day={day}
            data-unlocked={unlocked}
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
          </button>
        ))}
      </section>

      {selectedDay && (
        <DayModal day={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  )
}

export default Home
