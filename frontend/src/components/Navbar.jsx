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

  useEffect(() => {
    api.get('/products/categories/')
      .then(({ data }) => setCategories(data))
      .catch(() => {})  // Si falla, la barra simplemente queda vacía
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/?search=${encodeURIComponent(query)}`)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-amazon-blue text-white sticky top-0 z-40">
      {/* Barra principal */}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 text-xl font-bold text-amazon-orange mr-2">
          TiendaOnline
        </Link>

        {/* Buscador */}
        <form onSubmit={handleSearch} className="flex flex-1 max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos..."
            className="flex-1 rounded-l px-3 py-2 text-gray-900 text-sm outline-none"
          />
          <button
            type="submit"
            className="bg-amazon-orange hover:bg-amazon-orange-dark px-4 rounded-r transition-colors"
            aria-label="Buscar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amazon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>

        {/* Acciones de usuario */}
        <div className="flex items-center gap-4 ml-auto text-sm flex-shrink-0">
          {user ? (
            <>
              <span className="hidden sm:block text-gray-300">Hola, {user.username}</span>
              <Link to="/orders" className="hover:text-amazon-orange transition-colors">
                Mis Pedidos
              </Link>
              {user.is_staff && (
                <Link to="/admin" className="hover:text-amazon-orange transition-colors font-semibold">
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="hover:text-amazon-orange transition-colors"
              >
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

          {/* Carrito */}
          <button
            onClick={() => setOpen(true)}
            className="relative flex items-center gap-1 hover:text-amazon-orange transition-colors"
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
        </div>
      </div>

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
