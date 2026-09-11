import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function DayQuiz({ day, question }) {
  const { t } = useTranslation()
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
          placeholder={t('dayQuiz.placeholder')}
          aria-label={t('dayQuiz.answerLabel')}
        />
        <button type="submit" disabled={checking || !answer.trim()}>
          {t('dayQuiz.check')}
        </button>
      </div>
      {result === 'correct' && (
        <p
          role="status"
          className="day-modal__quiz-feedback day-modal__quiz-feedback--ok"
          data-testid="quiz-feedback"
        >
          {t('dayQuiz.correct')}
        </p>
      )}
      {result === 'incorrect' && (
        <p
          role="status"
          className="day-modal__quiz-feedback day-modal__quiz-feedback--ko"
          data-testid="quiz-feedback"
        >
          {t('dayQuiz.incorrect')}
        </p>
      )}
      {result === 'error' && (
        <p
          role="status"
          className="day-modal__quiz-feedback day-modal__quiz-feedback--ko"
          data-testid="quiz-feedback"
        >
          {t('dayQuiz.error')}
        </p>
      )}
    </form>
  )
}

export default DayQuiz
