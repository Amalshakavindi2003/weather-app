import { NavLink } from 'react-router-dom'

function Navbar() {
  const linkClassName = ({ isActive }) =>
    `navLink${isActive ? ' active' : ''}`

  return (
    <header className="navbar">
      <NavLink to="/" end className="navBrand">
        Weather App
      </NavLink>
      <nav className="navLinks" aria-label="Primary">
        <NavLink to="/" end className={linkClassName}>
          Home
        </NavLink>
        <NavLink to="/compare" className={linkClassName}>
          Compare
        </NavLink>
      </nav>
    </header>
  )
}

export default Navbar