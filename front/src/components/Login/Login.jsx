import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import './Login.css'

function Login({ onSuccess }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const user = await login(email, password)
      onSuccess?.(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <div className="login__icon" aria-hidden="true">
          🔐
        </div>
        <h1>Connexion administrateur</h1>
        <p className="login__hint">Accédez au tableau de bord pour gérer votre calendrier.</p>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <label className="login__field">
          Email
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="login__field">
          Mot de passe
          <input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button type="submit" className="login__submit" disabled={submitting}>
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}

export default Login
