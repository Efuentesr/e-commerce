import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

const STATUS_LABELS = {
  creada:    { label: 'Creada',    cls: 'badge-creada' },
  aprobada:  { label: 'Aprobada',  cls: 'badge-aprobada' },
  pagada:    { label: 'Pagada',    cls: 'badge-pagada' },
  entregada: { label: 'Entregada', cls: 'badge-entregada' },
  anulada:   { label: 'Anulada',   cls: 'badge-anulada' },
}

const TABS = ['Todas', 'creada', 'aprobada', 'pagada', 'entregada', 'anulada']

export default function AdminPanel() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Todas')
  const [actionLoading, setActionLoading] = useState({})
  const [discountEditing, setDiscountEditing] = useState({})  // { [orderId]: value }
  const [error, setError] = useState('')

  const fetchOrders = () => {
    api.get('/sales/orders/')
      .then(({ data }) => setOrders(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const filteredOrders = activeTab === 'Todas'
    ? orders
    : orders.filter((o) => o.status === activeTab)

  const doAction = async (orderId, action, extra = {}) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }))
    setError('')
    try {
      await api.patch(`/sales/orders/${orderId}/`, { action, ...extra })
      fetchOrders()
    } catch (err) {
      setError(err.response?.data?.error || `Error al ejecutar acción "${action}".`)
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  const handleDiscountSave = (orderId) => {
    const value = discountEditing[orderId]
    if (value === undefined || value === '') return
    doAction(orderId, 'discount', { discount: value })
    setDiscountEditing((prev) => { const n = { ...prev }; delete n[orderId]; return n })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amazon-orange" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Panel de Administración</h1>
      <p className="text-gray-500 text-sm mb-6">Gestión de órdenes de compra</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 font-bold">×</button>
        </div>
      )}

      {/* Tabs de estado */}
      <div className="flex gap-1 mb-4 border-b overflow-x-auto">
        {TABS.map((tab) => {
          const count = tab === 'Todas' ? orders.length : orders.filter(o => o.status === tab).length
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-amazon-orange text-amazon-orange'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'Todas' ? 'Todas' : STATUS_LABELS[tab]?.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Tabla de órdenes */}
      {filteredOrders.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No hay órdenes en este estado.</p>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const status = STATUS_LABELS[order.status] || { label: order.status, cls: 'badge' }
            const date = new Date(order.created_at).toLocaleString('es-AR')
            const busy = actionLoading[order.id]

            return (
              <div key={order.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Info básica */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800">#{order.id}</span>
                      <span className={status.cls}>{status.label}</span>
                      <span className="text-gray-500 text-xs">{date}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Cliente: <strong>{order.customer_username}</strong>
                      {' · '}{order.item_count} producto{order.item_count !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span>Subtotal: ${parseFloat(order.total_price).toFixed(2)}</span>
                      {parseFloat(order.discount) > 0 && (
                        <span className="text-green-600">Desc: -${parseFloat(order.discount).toFixed(2)}</span>
                      )}
                      <span className="font-bold">Total: ${parseFloat(order.final_price).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/orders/${order.id}`}
                      className="btn-secondary text-xs py-1 px-3"
                    >
                      Ver detalle
                    </Link>

                    {/* Editar descuento (solo en creada) */}
                    {order.status === 'creada' && (
                      <div className="flex items-center gap-1">
                        {discountEditing[order.id] !== undefined ? (
                          <>
                            <span className="text-xs text-gray-500">$</span>
                            <input
                              type="number"
                              min="0"
                              max={order.total_price}
                              step="0.01"
                              value={discountEditing[order.id]}
                              onChange={(e) => setDiscountEditing((prev) => ({ ...prev, [order.id]: e.target.value }))}
                              className="border rounded px-2 py-1 text-xs w-24"
                              autoFocus
                            />
                            <button
                              onClick={() => handleDiscountSave(order.id)}
                              disabled={busy}
                              className="bg-amazon-teal text-white text-xs px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setDiscountEditing((prev) => { const n = { ...prev }; delete n[order.id]; return n })}
                              className="text-gray-400 hover:text-gray-600 text-xs px-1"
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDiscountEditing((prev) => ({
                              ...prev,
                              [order.id]: parseFloat(order.discount || 0),
                            }))}
                            className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                          >
                            Editar descuento
                          </button>
                        )}
                      </div>
                    )}

                    {/* Marcar como pagada (solo aprobada) */}
                    {order.status === 'aprobada' && (
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Confirmar pago de la orden #${order.id}?`)) {
                            doAction(order.id, 'pagar')
                          }
                        }}
                        disabled={busy}
                        className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        {busy ? '...' : 'Marcar Pagada'}
                      </button>
                    )}

                    {/* Marcar como entregada (solo desde pagada) */}
                    {order.status === 'pagada' && (
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Confirmar entrega de la orden #${order.id}?`)) {
                            doAction(order.id, 'entregar')
                          }
                        }}
                        disabled={busy}
                        className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
                      >
                        {busy ? '...' : 'Marcar Entregada'}
                      </button>
                    )}

                    {/* Anular (admin: creada, aprobada o pagada — pagada devuelve stock) */}
                    {(order.status === 'creada' || order.status === 'aprobada' || order.status === 'pagada') && (
                      <button
                        onClick={() => {
                          const msg = order.status === 'pagada'
                            ? `¿Anular la orden #${order.id}? El stock será devuelto al inventario.`
                            : `¿Anular la orden #${order.id}?`
                          if (window.confirm(msg)) doAction(order.id, 'anular')
                        }}
                        disabled={busy}
                        className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        {busy ? '...' : 'Anular'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
