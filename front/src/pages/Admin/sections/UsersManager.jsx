import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/useAuth'

function UsersManager() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function loadUsers() {
    fetch('/api/admin/users', { credentials: 'include' })
      .then((res) => res.json())
      .then(setUsers)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function toggleRole(user) {
    const nextRole = user.roles.includes('admin') ? 'user' : 'admin'
    setError(null)

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole }),
    })

    if (!res.ok) {
      setError((await res.json()).error)
      return
    }

    loadUsers()
  }

  async function toggleActive(user) {
    setError(null)
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    })

    if (!res.ok) {
      setError((await res.json()).error)
      return
    }

    loadUsers()
  }

  if (loading) return <p>Chargement…</p>

  return (
    <div className="admin-section">
      <h2>Utilisateurs</h2>
      {error && <p className="admin-section__error">{error}</p>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.roles.includes('admin') ? 'Administrateur' : 'Utilisateur'}</td>
              <td>{user.isActive ? 'Actif' : 'Inactif'}</td>
              <td className="admin-table__actions">
                <button type="button" onClick={() => toggleRole(user)} disabled={user.id === currentUser?.id}>
                  {user.roles.includes('admin') ? 'Retirer admin' : 'Rendre admin'}
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  onClick={() => toggleActive(user)}
                  disabled={user.id === currentUser?.id}
                >
                  {user.isActive ? 'Désactiver' : 'Activer'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default UsersManager
