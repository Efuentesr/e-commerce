import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

// Clave usada para guardar el carrito de invitados en localStorage
const GUEST_CART_KEY = 'guest_cart'

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(null)        // Carrito del usuario autenticado (API)
  const [guestCart, setGuestCart] = useState([]) // Carrito de invitado (localStorage)
  const [open, setOpen] = useState(false)        // Visibilidad del drawer del carrito

  // ── Cargar carrito al cambiar el usuario ──
  useEffect(() => {
    if (user) {
      fetchCart()
    } else {
      const stored = localStorage.getItem(GUEST_CART_KEY)
      setGuestCart(stored ? JSON.parse(stored) : [])
      setCart(null)
    }
  }, [user])

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/sales/cart/')
      setCart(data)
    } catch (err) {
      console.error('Error al cargar el carrito:', err)
    }
  }

  // Sincroniza el carrito de invitado con la base de datos al iniciar sesión
  const syncGuestCart = useCallback(async () => {
    const stored = localStorage.getItem(GUEST_CART_KEY)
    const items = stored ? JSON.parse(stored) : []
    if (items.length === 0) return

    try {
      const { data } = await api.post('/sales/sync-cart/', { items })
      setCart(data)
      localStorage.removeItem(GUEST_CART_KEY)
      setGuestCart([])
    } catch (err) {
      console.error('Error al sincronizar carrito:', err)
    }
  }, [])

  // Ejecutar sincronización cuando el usuario hace login
  useEffect(() => {
    if (user) {
      syncGuestCart()
    }
  }, [user, syncGuestCart])

  const addItem = async (product, quantity = 1) => {
    if (user) {
      try {
        const { data } = await api.post('/sales/cart/add_item/', {
          product_id: product.id,
          quantity,
        })
        setCart(data)
        setOpen(true)
      } catch (err) {
        throw new Error(err.response?.data?.error || 'Error al agregar al carrito.')
      }
    } else {
      // Guardar en localStorage como invitado
      setGuestCart((prev) => {
        const existing = prev.find((i) => i.product_id === product.id)
        let updated
        if (existing) {
          updated = prev.map((i) =>
            i.product_id === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        } else {
          updated = [...prev, { product_id: product.id, product, quantity }]
        }
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updated))
        return updated
      })
      setOpen(true)
    }
  }

  const removeItem = async (itemId) => {
    if (user) {
      try {
        const { data } = await api.delete('/sales/cart/remove_item/', {
          data: { item_id: itemId },
        })
        setCart(data)
      } catch (err) {
        console.error('Error al eliminar item:', err)
      }
    } else {
      setGuestCart((prev) => {
        const updated = prev.filter((i) => i.product_id !== itemId)
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updated))
        return updated
      })
    }
  }

  const clearCart = () => {
    if (user) {
      fetchCart()
    } else {
      setGuestCart([])
      localStorage.removeItem(GUEST_CART_KEY)
    }
  }

  // Ítems y total unificados (autenticado vs invitado)
  const items = user ? (cart?.items || []) : guestCart
  const total = user
    ? parseFloat(cart?.total || 0)
    : guestCart.reduce((acc, i) => acc + i.product.price * i.quantity, 0)
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      cart, guestCart, items, total, itemCount, open,
      setOpen, addItem, removeItem, clearCart, fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
