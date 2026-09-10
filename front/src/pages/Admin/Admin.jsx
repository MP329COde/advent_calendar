import { useEffect } from 'react'
import './Admin.css'
import Login from '../../components/Login/Login'


function Admin() {
    useEffect(() => {
    let cancelled = false

    fetch('/api/login')
      .then((res) => {
        if (!res.ok) throw new Error('Error admin')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) (data)
      })
      .catch((err) => {
        if (!cancelled) (err.message)
      })

    fetch('/api/admin')
      .then((res) => {
        if (!res.ok) throw new Error('Erreur lors du chargement du calendrier')
        return res.json()
      })
      .then((data) => {
        if (!cancelled)(data)
      })
      .catch((err) => {
        if (!cancelled) (err.message)
      })

    fetch('/api/admin')
      .then((res) => {
        if (!res.ok) throw new Error('Erreur lors du chargement du calendrier')
        return res.json()
      })
      .then((data) => {
        if (!cancelled)(data)
      })
      .catch((err) => {
        if (!cancelled) (err.message)
      })


    return () => {
      cancelled = true
    }    
  }, [])
    return (
        <div className="admin">
            <h1>Admin</h1>
            <Login />
        </div>
    )
}

export default Admin