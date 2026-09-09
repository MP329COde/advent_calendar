import { NavLink } from 'react-router-dom'
import './Header.css'

function Header() {
  return (
    <header className="site-header">
      <NavLink to="/" className="site-header__brand">
        <span className="site-header__emoji" aria-hidden="true">
          🎄
        </span>
        <span className="text-title-sm">Calendrier de l&apos;Avent</span>
      </NavLink>

      <nav className="site-header__nav" aria-label="Navigation principale">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? 'site-header__link is-active' : 'site-header__link'
          }
        >
          Accueil
        </NavLink>
      </nav>
    </header>
  )
}

export default Header
