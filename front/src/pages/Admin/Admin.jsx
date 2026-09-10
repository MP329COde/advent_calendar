import { useEffect } from 'react'
import './Admin.css'

function Admin() {
    useEffect(() => {
    let cancelled = false

    fetch('/api/login')
      .then((res) => {
        if (!res.ok) throw new Error('Error admin')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) login(data)
      })
      .catch((err) => {
        if (!cancelled) login(err.message)
      })

    fetch('/api/admin')
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
        <div className="admin">
            <h1>Admin</h1>
        </div>
    )
}

export default Admin