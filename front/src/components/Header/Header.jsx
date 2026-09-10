import { NavLink } from 'react-router-dom'
import './Header.css'

function Header() {
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
          Accueil
        </NavLink>
        <NavLink
          to="/About"
          className={({ isActive }) =>
            isActive ? 'site-header__link is-active' : 'site-header__link'
          }
        >
          À propos
        </NavLink>
      </nav>
    </header>
  )
}

export default Header