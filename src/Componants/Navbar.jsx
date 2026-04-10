import { NavLink } from 'react-router-dom'
import { useTheme } from './ThemeContext'

function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const linkClassName = ({ isActive }) => `navLink${isActive ? ' active' : ''}`
  const isDarkMode = theme === 'dark'

  return (
    <header className="navbar">
      <NavLink to="/" end className="navBrand">
        Weather App
      </NavLink>
      <div className="navActions">
        <nav className="navLinks" aria-label="Primary">
          <NavLink to="/" end className={linkClassName}>
            Home
          </NavLink>
          <NavLink to="/compare" className={linkClassName}>
            Compare
          </NavLink>
          <NavLink to="/favorites" className={linkClassName}>
            Favorites
          </NavLink>
          <NavLink to="/air-quality" className={linkClassName}>
            Air Quality
          </NavLink>
        </nav>
        <button
          type="button"
          className="themeToggle"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span aria-hidden="true" className="themeToggleIcon">
            {isDarkMode ? '☀' : '☾'}
          </span>
        </button>
      </div>
    </header>
  )
}

export default Navbar