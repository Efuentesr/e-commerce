import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import api from '../api/axios'

export default function Navbar({ onSearch }) {
  const { user, logout } = useAuth()
  const { itemCount, setOpen } = useCart()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    api.get('/products/categories/')
      .then(({ data }) => setCategories(data))
      .catch(() => {})  // Si falla, la barra simplemente queda vacía
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/?search=${encodeURIComponent(query)}`)
    setMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="bg-amazon-blue text-white sticky top-0 z-40">
      {/* Barra principal */}
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Logo — texto corto en mobile */}
        <Link to="/" className="flex-shrink-0 font-bold text-green-500">
          <span className="hidden sm:inline text-xl">TiendaOnline</span>
          <span className="sm:hidden text-base">Tienda</span>
        </Link>

        {/* Buscador — min-w-0 evita que desborde el flex */}
        <form onSubmit={handleSearch} className="flex flex-1 min-w-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 min-w-0 rounded-l px-3 py-2 text-gray-900 text-sm outline-none"
          />
          <button
            type="submit"
            className="bg-amazon-orange hover:bg-amazon-orange-dark px-3 rounded-r transition-colors flex-shrink-0"
            aria-label="Buscar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amazon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>

        {/* Lado derecho — contenedor flex-shrink-0 garantiza que nunca se oculte */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Links de usuario — solo desktop */}
          <div className="hidden sm:flex items-center gap-4 text-sm">
            {user ? (
              <>
                <span className="text-gray-300">Hola, <b>{user.username}</b></span>
                <Link to="/orders" className="hover:text-amazon-orange transition-colors">
                  Mis Pedidos
                </Link>
                <Link to="/profile" className="hover:text-amazon-orange transition-colors">
                  Mi Perfil
                </Link>
                {user.is_staff && (
                  <Link to="/admin" className="hover:text-amazon-orange transition-colors font-semibold">
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="hover:text-amazon-orange transition-colors">
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-amazon-orange transition-colors">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="hover:text-amazon-orange transition-colors">
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Carrito — siempre visible */}
          <button
            onClick={() => setOpen(true)}
            className="relative hover:text-amazon-orange transition-colors"
            aria-label="Carrito"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amazon-orange text-amazon-blue text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>

          {/* Hamburguesa — solo mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden hover:text-amazon-orange transition-colors"
            aria-label="Menú"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menú desplegable mobile */}
      {menuOpen && (
        <div className="sm:hidden bg-amazon-blue-light border-t border-white/10 px-4 py-3 flex flex-col gap-3 text-sm">
          {user ? (
            <>
              <span className="text-gray-300">Hola, <b>{user.username}</b></span>
              <Link to="/orders" onClick={() => setMenuOpen(false)} className="hover:text-amazon-orange transition-colors">
                Mis Pedidos
              </Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="hover:text-amazon-orange transition-colors">
                Mi Perfil
              </Link>
              {user.is_staff && (
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="hover:text-amazon-orange transition-colors font-semibold">
                  Panel Admin
                </Link>
              )}
              <button onClick={handleLogout} className="text-left hover:text-amazon-orange transition-colors">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="hover:text-amazon-orange transition-colors">
                Iniciar Sesión
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="hover:text-amazon-orange transition-colors">
                Registrarse
              </Link>
            </>
          )}
        </div>
      )}

      {/* Barra secundaria — categorías dinámicas desde la API */}
      <div className="bg-amazon-blue-light px-4 py-1 flex gap-6 text-sm overflow-x-auto">
        <Link to="/" className="hover:text-amazon-orange whitespace-nowrap transition-colors">
          Todos
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            to={`/?category=${cat.slug}`}
            className="hover:text-amazon-orange whitespace-nowrap transition-colors"
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </header>
  )
}
