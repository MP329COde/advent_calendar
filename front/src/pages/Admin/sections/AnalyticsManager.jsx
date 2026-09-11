import { useEffect, useState } from 'react'

function AnalyticsManager() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics', { credentials: 'include' })
      .then((res) => res.json())
      .then(setSummary)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Chargement…</p>
  if (!summary) return <p>Impossible de charger les statistiques.</p>

  return (
    <div className="admin-section">
      <h2>Statistiques de participation</h2>
      <p className="admin-section__hint">
        Ouvertures de case et réponses au quiz, comptabilisées de façon anonyme
        (aucune IP ni identifiant de visiteur n&apos;est enregistré).
      </p>

      <div className="admin-analytics-totals" data-testid="analytics-totals">
        <div>
          <strong>{summary.totals.opens}</strong>
          <span>Cases ouvertes</span>
        </div>
        <div>
          <strong>{summary.totals.quizCorrect}</strong>
          <span>Bonnes réponses</span>
        </div>
        <div>
          <strong>{summary.totals.quizIncorrect}</strong>
          <span>Mauvaises réponses</span>
        </div>
      </div>

      <table className="admin-analytics-table" data-testid="analytics-table">
        <thead>
          <tr>
            <th>Jour</th>
            <th>Ouvertures</th>
            <th>Quiz ✅</th>
            <th>Quiz ❌</th>
          </tr>
        </thead>
        <tbody>
          {summary.days.map((d) => (
            <tr key={d.day}>
              <td>{d.day}</td>
              <td>{d.opens}</td>
              <td>{d.quizCorrect}</td>
              <td>{d.quizIncorrect}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AnalyticsManager
