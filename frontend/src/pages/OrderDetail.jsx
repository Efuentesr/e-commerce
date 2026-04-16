import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const STATUS_LABELS = {
  creada:    { label: 'Creada',    cls: 'badge-creada' },
  aprobada:  { label: 'Aprobada',  cls: 'badge-aprobada' },
  pagada:    { label: 'Pagada',    cls: 'badge-pagada' },
  entregada: { label: 'Entregada', cls: 'badge-entregada' },
  anulada:   { label: 'Anulada',   cls: 'badge-anulada' },
}

export default function OrderDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [discountInput, setDiscountInput] = useState('')
  const [discountSaved, setDiscountSaved] = useState(false)

  const fetchOrder = () => {
    api.get(`/sales/orders/${id}/`)
      .then(({ data }) => {
        setOrder(data)
        setDiscountInput(parseFloat(data.discount || 0).toFixed(2))
      })
      .catch(() => navigate('/orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrder() }, [id])

  const doAction = async (action, extra = {}) => {
    setActionLoading(true)
    setError('')
    try {
      const { data } = await api.patch(`/sales/orders/${id}/`, { action, ...extra })
      setOrder(data)
      setDiscountInput(parseFloat(data.discount || 0).toFixed(2))
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la acción.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDiscountSave = async () => {
    const value = parseFloat(discountInput)
    if (isNaN(value) || value < 0) {
      setError('Ingresá un descuento válido (mayor o igual a cero).')
      return
    }
    if (value > parseFloat(order.total_price)) {
      setError('El descuento no puede superar el total del pedido.')
      return
    }
    setDiscountSaved(false)
    await doAction('discount', { discount: value })
    setDiscountSaved(true)
    setTimeout(() => setDiscountSaved(false), 3000)
  }

  const shareWhatsApp = () => {
    if (!order) return
    const items = order.items.map((i,index) => `${index}• ${i.product_name} x${i.quantity} = $${parseFloat(i.subtotal).toFixed(2)}`).join('\n')
    const msg = [
      `*Pedido #${order.id}* - TiendaOnline`,
      `Cliente: ${order.customer_username}`,
      `Estado: ${STATUS_LABELS[order.status]?.label}`,
      ``,
      items,
      ``,
      `Subtotal: $${parseFloat(order.total_price).toFixed(2)}`,
      parseFloat(order.discount) > 0 ? `Descuento: -$${parseFloat(order.discount).toFixed(2)}` : null,
      `*Total: $${parseFloat(order.final_price).toFixed(2)}*`,
    ].filter(Boolean).join('\n')

    // Limpiar el teléfono: dejar solo dígitos y el signo +
    const rawPhone = order.customer_phone || ''
    const phone = rawPhone.replace(/[^\d+]/g, '')

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`

    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amazon-orange" />
      </div>
    )
  }

  if (!order) return null

  const status = STATUS_LABELS[order.status] || { label: order.status, cls: 'badge' }
  const isOwner = user?.username === order.customer_username || user?.is_staff
  const date = new Date(order.created_at).toLocaleString('es-AR')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="text-amazon-teal hover:underline text-sm">← Mis Pedidos</Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-xl font-bold">Pedido #{order.id}</h1>
        <span className={status.cls}>{status.label}</span>
      </div>

      {/* Info del pedido */}
      <div className="card p-5 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Cliente</p>
            <p className="font-medium">{order.customer_username}</p>
            {order.customer_phone ? (
              <p className="text-xs text-gray-500">{order.customer_phone}</p>
            ) : (
              <p className="text-xs text-amber-500">Sin teléfono registrado</p>
            )}
          </div>
          <div>
            <p className="text-gray-500">Fecha</p>
            <p className="font-medium">{date}</p>
          </div>
          <div>
            <p className="text-gray-500">Subtotal</p>
            <p className="font-medium">${parseFloat(order.total_price).toFixed(2)}</p>
          </div>
          {parseFloat(order.discount) > 0 && (
            <div>
              <p className="text-gray-500">Descuento</p>
              <p className="font-medium text-green-600">-${parseFloat(order.discount).toFixed(2)}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Total a pagar</p>
            <p className="text-xl font-bold">${parseFloat(order.final_price).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Ítems */}
      <div className="card p-5 mb-4">
        <h2 className="font-bold mb-3">Productos</h2>
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 text-sm">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-gray-500 text-xs">Código: {item.product_code}</p>
                <p className="text-gray-500 text-xs">Precio unitario: ${parseFloat(item.price).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">x{item.quantity}</p>
                <p className="font-semibold">${parseFloat(item.subtotal).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Descuento — solo admin en estado creada */}
      {user?.is_staff && order.status === 'creada' && (
        <div className="card p-5 mb-4 border-l-4 border-amazon-orange">
          <h2 className="font-bold mb-3 text-gray-800">Aplicar descuento</h2>
          <p className="text-sm text-gray-500 mb-3">
            Podés ajustar el descuento luego de coordinar con el cliente. El total final se recalcula automáticamente.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-300 rounded overflow-hidden flex-1 max-w-xs">
              <span className="bg-gray-100 px-3 py-2 text-gray-600 font-medium border-r border-gray-300">$</span>
              <input
                type="number"
                min="0"
                max={order.total_price}
                step="0.01"
                value={discountInput}
                onChange={(e) => { setDiscountInput(e.target.value); setDiscountSaved(false) }}
                className="flex-1 px-3 py-2 text-sm outline-none"
                placeholder="0.00"
              />
            </div>
            <button
              onClick={handleDiscountSave}
              disabled={actionLoading}
              className="btn-primary disabled:opacity-50"
            >
              {actionLoading ? 'Guardando...' : 'Guardar descuento'}
            </button>
          </div>
          {discountSaved && (
            <p className="text-amazon-teal text-sm mt-2 font-medium">
              Descuento aplicado correctamente.
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Subtotal: ${parseFloat(order.total_price).toFixed(2)}
            {parseFloat(discountInput) > 0 && !isNaN(parseFloat(discountInput)) && (
              <> · Total con descuento: <strong className="text-gray-700">${Math.max(0, parseFloat(order.total_price) - parseFloat(discountInput)).toFixed(2)}</strong></>
            )}
          </p>
        </div>
      )}

      {/* Historial de estados */}
      {order.history?.length > 0 && (
        <div className="card p-5 mb-4">
          <h2 className="font-bold mb-4">Historial del pedido</h2>
          <ol className="relative border-l border-gray-200 ml-2 space-y-4">
            {order.history.map((entry, idx) => (
              <li key={idx} className="ml-4">
                <span className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-amazon-teal border-2 border-white" />
                <p className="text-sm font-medium text-gray-800">{entry.note}</p>
                <p className="text-xs text-gray-400">
                  {new Date(entry.changed_at).toLocaleString('es-AR', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Acciones */}
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div className="flex flex-wrap gap-3">
        {/* Aprobar (cliente, orden creada) */}
        {order.status === 'creada' && !user?.is_staff && (
          <button
            onClick={() => doAction('aprobar')}
            disabled={actionLoading}
            className="btn-primary disabled:opacity-50"
          >
            Aprobar Pedido
          </button>
        )}

        {/* Marcar como pagada (solo admin, orden aprobada) */}
        {user?.is_staff && order.status === 'aprobada' && (
          <button
            onClick={() => {
              if (window.confirm(`¿Confirmar el pago de la orden #${order.id}?`)) {
                doAction('pagar')
              }
            }}
            disabled={actionLoading}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            Confirmar Pago
          </button>
        )}

        {/* Marcar como entregada (solo admin, orden pagada) */}
        {user?.is_staff && order.status === 'pagada' && (
          <button
            onClick={() => {
              if (window.confirm(`¿Confirmar la entrega de la orden #${order.id}?`)) {
                doAction('entregar')
              }
            }}
            disabled={actionLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            Marcar como Entregada
          </button>
        )}

        {/* Anular:
            - Cliente: solo en "creada"
            - Admin: en "creada", "aprobada" y "pagada" (devuelve stock) */}
        {(order.status === 'creada' ||
          (user?.is_staff && (order.status === 'aprobada' || order.status === 'pagada'))
        ) && (
          <button
            onClick={() => {
              const msg = order.status === 'pagada'
                ? '¿Anular esta orden pagada? El stock será devuelto al inventario.'
                : '¿Estás seguro de que querés anular este pedido?'
              if (window.confirm(msg)) doAction('anular')
            }}
            disabled={actionLoading}
            className="btn-danger disabled:opacity-50"
          >
            Anular Pedido
          </button>
        )}

        {/* Compartir por WhatsApp */}
        <button
          onClick={shareWhatsApp}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Enviar por WhatsApp
        </button>
      </div>
    </div>
  )
}
