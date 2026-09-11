import { useState } from 'react'
import './Admin.css'
import Login from '../../components/Login/Login'
import { useAuth } from '../../auth/useAuth'
import ThemeManager from './sections/ThemeManager'
import BrandingManager from './sections/BrandingManager'
import FeatureFlagsManager from './sections/FeatureFlagsManager'
import UsersManager from './sections/UsersManager'
import DaysManager from './sections/DaysManager'
import AnalyticsManager from './sections/AnalyticsManager'

const TABS = [
  { key: 'branding', label: 'Identité', icon: '🎨' },
  { key: 'theme', label: 'Thèmes', icon: '🖌️' },
  { key: 'days', label: 'Calendrier', icon: '📅' },
  { key: 'features', label: 'Fonctionnalités', icon: '⚙️' },
  { key: 'users', label: 'Utilisateurs', icon: '👥' },
  { key: 'analytics', label: 'Statistiques', icon: '📊' },
]

function AdminDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('branding')
  const isAdmin = user?.roles?.includes('admin')

  return (
    <div className="admin">
      <header className="admin__header">
        <div>
          <h1>Administration</h1>
          <p className="admin__welcome">Connecté en tant que {user.name}</p>
        </div>
        <button type="button" className="admin__logout" onClick={logout}>
          Déconnexion
        </button>
      </header>

      {!isAdmin ? (
        <p className="admin__forbidden" role="alert">
          Votre compte n’a pas les droits d’administration nécessaires.
        </p>
      ) : (
        <div className="admin__layout">
          <nav className="admin__tabs" aria-label="Sections de l’administration">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? 'admin__tab is-active' : 'admin__tab'}
                onClick={() => setActiveTab(tab.key)}
                aria-current={activeTab === tab.key}
              >
                <span aria-hidden="true">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>

          <div className="admin__content">
            {activeTab === 'branding' && <BrandingManager />}
            {activeTab === 'theme' && <ThemeManager />}
            {activeTab === 'days' && <DaysManager />}
            {activeTab === 'features' && <FeatureFlagsManager />}
            {activeTab === 'users' && <UsersManager />}
            {activeTab === 'analytics' && <AnalyticsManager />}
          </div>
        </div>
      )}
    </div>
  )
}

function Admin() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="admin">
        <p>Chargement…</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return <AdminDashboard />
}

export default Admin
