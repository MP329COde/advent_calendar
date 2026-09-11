import { useEffect, useRef, useState } from 'react'

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const containerRef = useRef(null)

  const load = () => {
    fetch('/api/notifications', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        setUnreadCount(data.unreadCount)
        setNotifications(data.notifications)
      })
      .catch(() => {})
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markOneRead = (id) => {
    fetch(`/api/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' })
      .then(() => load())
      .catch(() => {})
  }

  const markAllRead = () => {
    fetch('/api/notifications/read-all', { method: 'PATCH', credentials: 'include' })
      .then(() => load())
      .catch(() => {})
  }

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        data-testid="notification-bell-trigger"
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-bell__badge" data-testid="notification-bell-badge">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-bell__panel" data-testid="notification-bell-panel">
          <div className="notification-bell__header">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="notification-bell__mark-all">
                Tout marquer comme lu
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="notification-bell__empty">Aucune notification pour le moment.</p>
          ) : (
            <ul className="notification-bell__list">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={n.isRead ? 'notification-bell__item' : 'notification-bell__item is-unread'}
                  onClick={() => !n.isRead && markOneRead(n.id)}
                >
                  <p className="notification-bell__item-title">{n.title}</p>
                  <p className="notification-bell__item-message">{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
