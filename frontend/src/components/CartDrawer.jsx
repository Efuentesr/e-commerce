import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function CartDrawer() {
  const { open, setOpen, items, total, itemCount, removeItem, clearCart, fetchCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState('')

  const handleCrearOrden = async () => {
    if (!user) {
      navigate('/login')
      setOpen(false)
      return
    }
    setCreando(true)
    setError('')
    try {
      const { data } = await api.post('/sales/orders/')
      fetchCart()
      setOpen(false)
      navigate(`/orders/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la orden.')
    } finally {
      setCreando(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 max-w-full bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between bg-amazon-blue text-white px-4 py-3">
          <h2 className="font-bold text-lg">
            Carrito ({itemCount})
          </h2>
          <button onClick={() => setOpen(false)} className="hover:text-amazon-orange" aria-label="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista de ítems */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 mt-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            items.map((item) => {
              // Compatibilidad con estructura de API (autenticado) e invitado (localStorage)
              const name = item.product?.name || item.product?.name
              const price = parseFloat(item.product?.price || 0)
              const subtotal = parseFloat(item.subtotal || price * item.quantity)
              const imgUrl = item.product?.featured_image

              return (
                <div key={item.id || item.product_id} className="flex gap-3 border-b pb-3">
                  {imgUrl && (
                    <img src={imgUrl} alt={name} className="w-16 h-16 object-contain border rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{name}</p>
                    <p className="text-xs text-gray-500">Cant: {item.quantity}</p>
                    <p className="text-sm font-bold text-gray-800">${subtotal.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id || item.product_id)}
                    className="text-red-400 hover:text-red-600 self-start"
                    aria-label="Eliminar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer con total y acciones */}
        {items.length > 0 && (
          <div className="p-4 border-t space-y-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleCrearOrden}
              disabled={creando}
              className="w-full btn-primary text-center disabled:opacity-50"
            >
              {creando ? 'Procesando...' : user ? 'Generar Pedido' : 'Iniciar sesión para comprar'}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
