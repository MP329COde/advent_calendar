import useDocumentTitle from '../../hooks/useDocumentTitle'
import './Home.css'

const DAYS = Array.from({ length: 24 }, (_, index) => index + 1)

function isDayUnlocked(day) {
  const today = new Date()
  const isDecember = today.getMonth() === 11
  return isDecember && day <= today.getDate()
}

function Home() {
  useDocumentTitle()

  return (
    <div className="home">
      <section className="home__hero">
        <h1 className="text-display-hero">Calendrier de l&apos;Avent</h1>
        <p className="text-body-lg">
          Un défi, une surprise par jour : ouvrez la case du jour du 1er au 24
          décembre pour découvrir le mini-projet à relever.
        </p>
      </section>

      <section className="home__grid" aria-label="Cases du calendrier">
        {DAYS.map((day) => {
          const unlocked = isDayUnlocked(day)
          return (
            <div
              key={day}
              className={
                unlocked ? 'day-card day-card--unlocked' : 'day-card'
              }
              aria-label={
                unlocked
                  ? `Jour ${day}, débloqué`
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
          )
        })}
      </section>
    </div>
  )
}

export default Home
