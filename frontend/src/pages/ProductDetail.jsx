import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useCart } from '../context/CartContext'

function Stars({ rating, count }) {
  if (!rating) return <span className="text-sm text-gray-400">Sin reseñas aún</span>
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <svg
            key={n}
            className={`w-5 h-5 ${n <= Math.round(rating) ? 'text-amazon-orange' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-amazon-teal font-medium">{rating} de 5</span>
      <span className="text-sm text-gray-500">({count} reseña{count !== 1 ? 's' : ''})</span>
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImg, setSelectedImg] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [addedMsg, setAddedMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/products/products/${id}/`)
      .then(({ data }) => setProduct(data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amazon-orange" />
      </div>
    )
  }

  if (!product) return null

  const images = product.images?.length > 0 ? product.images : []
  const mainImage = images[selectedImg]?.image || product.featured_image
  const sinStock = product.available_stock === 0

  const handleAddToCart = async () => {
    setAdding(true)
    setError('')
    setAddedMsg('')
    try {
      await addItem(product, quantity)
      setAddedMsg(`¡${quantity} unidad${quantity > 1 ? 'es' : ''} agregada${quantity > 1 ? 's' : ''} al carrito!`)
      setTimeout(() => setAddedMsg(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <button onClick={() => navigate('/')} className="hover:text-amazon-teal">Tienda</button>
        <span>/</span>
        <button
          onClick={() => navigate(`/?category=${product.category}`)}
          className="hover:text-amazon-teal"
        >
          {product.category_name}
        </button>
        <span>/</span>
        <span className="text-gray-800 line-clamp-1">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* ── Galería de imágenes ── */}
        <div className="flex flex-col-reverse sm:flex-row gap-4 lg:w-1/2">
          {/* Miniaturas */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-[480px]">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImg(idx)}
                  className={`flex-shrink-0 w-16 h-16 border-2 rounded overflow-hidden transition-colors ${
                    idx === selectedImg ? 'border-amazon-orange' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={img.image}
                    alt={img.alt_text || `Imagen ${idx + 1}`}
                    className="w-full h-full object-contain bg-white"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Imagen principal */}
          <div className="flex-1 bg-white rounded-lg border flex items-center justify-center min-h-64 sm:min-h-96 overflow-hidden">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                className="max-w-full max-h-[480px] object-contain p-6 transition-opacity duration-200"
                key={mainImage}
              />
            ) : (
              <div className="text-gray-300 text-center p-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm">Sin imagen</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Panel de compra ── */}
        <div className="lg:w-1/2 flex flex-col gap-4">
          {/* Nombre y código */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Cód: {product.code} · {product.category_name}
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 leading-snug">{product.name}</h1>
          </div>

          {/* Rating */}
          <Stars rating={product.average_rating} count={product.review_count} />

          <hr />

          {/* Precio */}
          <div>
            <span className="text-3xl font-bold text-gray-900">
              ${parseFloat(product.price).toFixed(2)}
            </span>
          </div>

          {/* Disponibilidad */}
          <p className={`text-sm font-medium ${sinStock ? 'text-red-500' : 'text-amazon-teal'}`}>
            {sinStock ? 'Sin stock' : `En stock (${product.available_stock} disponibles)`}
          </p>

          {/* Cantidad + Agregar al carrito */}
          {!sinStock && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Cantidad:</label>
                <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 font-bold text-lg leading-none"
                  >
                    −
                  </button>
                  <span className="px-4 py-1 text-sm font-medium min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.available_stock, q + 1))}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 font-bold text-lg leading-none"
                  >
                    +
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {addedMsg && (
                <p className="text-amazon-teal text-sm font-medium">{addedMsg}</p>
              )}

              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="btn-primary py-3 text-base disabled:opacity-50"
              >
                {adding ? 'Agregando...' : 'Añadir al carrito'}
              </button>
            </div>
          )}

          {/* Descripción */}
          {product.description && (
            <div className="mt-2">
              <h2 className="font-semibold text-gray-800 mb-1">Descripción</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Reseñas ── */}
      {product.reviews?.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">
            Reseñas de clientes ({product.reviews.length})
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{review.username}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <svg
                        key={n}
                        className={`w-4 h-4 ${n <= review.rating ? 'text-amazon-orange' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(review.created_at).toLocaleDateString('es-AR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
