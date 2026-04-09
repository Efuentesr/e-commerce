import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

// Renderiza estrellas según el rating
function Stars({ rating }) {
  if (!rating) return <span className="text-xs text-gray-400">Sin reseñas</span>
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? 'text-amazon-orange' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500">({rating})</span>
    </div>
  )
}

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const handleAddToCart = async () => {
    setAdding(true)
    setError('')
    try {
      await addItem(product)
    } catch (e) {
      setError(e.message)
    } finally {
      setAdding(false)
    }
  }

  const imageUrl = product.featured_image || `https://placehold.co/400x400/131921/FFA500?text=${encodeURIComponent(product.name.slice(0, 10))}`
  const sinStock = product.available_stock === 0

  const goToDetail = () => navigate(`/products/${product.id}`)

  return (
    <div className="card flex flex-col group">
      {/* Imagen — clic navega al detalle */}
      <div
        className="relative overflow-hidden rounded-t bg-white h-48 cursor-pointer"
        onClick={goToDetail}
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {sinStock && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-red-600 px-2 py-1 rounded">Sin stock</span>
          </div>
        )}
      </div>

      {/* Info del producto */}
      <div className="p-3 flex flex-col flex-1">
        <h3
          className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 flex-1 cursor-pointer hover:text-amazon-teal"
          onClick={goToDetail}
        >
          {product.name}
        </h3>

        <Stars rating={product.average_rating} />

        <div className="mt-2">
          <span className="text-xl font-bold text-gray-900">
            ${parseFloat(product.price).toFixed(2)}
          </span>
        </div>

        <p className="text-xs text-gray-500 mt-1">
          {sinStock ? (
            <span className="text-red-500">No disponible</span>
          ) : (
            <span className="text-amazon-teal">En stock ({product.available_stock})</span>
          )}
        </p>

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

        <button
          onClick={handleAddToCart}
          disabled={sinStock || adding}
          className="mt-3 w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {adding ? 'Agregando...' : 'Añadir al carrito'}
        </button>
      </div>
    </div>
  )
}
