import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/useAuth'
import { setLanguage } from '../../i18n'
import NotificationBell from './NotificationBell'
import './Header.css'

function Header() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()

  return (
    <header className="site-header">
      <nav className="site-header__nav" aria-label="Navigation principale">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? 'site-header__link is-active' : 'site-header__link'
          }
        >
          {t('header.home')}
        </NavLink>
        <NavLink
          to="/About"
          className={({ isActive }) =>
            isActive ? 'site-header__link is-active' : 'site-header__link'
          }
        >
          {t('header.about')}
        </NavLink>
      </nav>
      <div className="site-header__actions">
        <select
          className="site-header__lang"
          aria-label={t('language.label')}
          value={i18n.resolvedLanguage}
          onChange={(event) => setLanguage(event.target.value)}
          data-testid="language-select"
        >
          <option value="fr">{t('language.fr')}</option>
          <option value="en">{t('language.en')}</option>
        </select>
        {user && <NotificationBell />}
      </div>
    </header>
  )
}

export default Header