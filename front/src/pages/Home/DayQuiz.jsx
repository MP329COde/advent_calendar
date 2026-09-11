import { useState } from 'react'

function DayQuiz({ day, question }) {
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setChecking(true)
    setResult(null)
    try {
      const res = await fetch(`/api/days/${day}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      })
      const data = await res.json()
      setResult(res.ok ? (data.correct ? 'correct' : 'incorrect') : 'error')
    } catch {
      setResult('error')
    } finally {
      setChecking(false)
    }
  }

  return (
    <form className="day-modal__quiz" data-testid="day-modal-quiz" onSubmit={handleSubmit}>
      <p className="day-modal__quiz-question">🎯 {question}</p>
      <div className="day-modal__quiz-row">
        <input
          type="text"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Votre réponse…"
          aria-label="Réponse au quiz"
        />
        <button type="submit" disabled={checking || !answer.trim()}>
          Vérifier
        </button>
      </div>
      {result === 'correct' && (
        <p
          role="status"
          className="day-modal__quiz-feedback day-modal__quiz-feedback--ok"
          data-testid="quiz-feedback"
        >
          ✅ Bonne réponse !
        </p>
      )}
      {result === 'incorrect' && (
        <p
          role="status"
          className="day-modal__quiz-feedback day-modal__quiz-feedback--ko"
          data-testid="quiz-feedback"
        >
          ❌ Pas tout à fait, réessayez !
        </p>
      )}
      {result === 'error' && (
        <p
          role="status"
          className="day-modal__quiz-feedback day-modal__quiz-feedback--ko"
          data-testid="quiz-feedback"
        >
          Impossible de vérifier la réponse pour le moment.
        </p>
      )}
    </form>
  )
}

export default DayQuiz
