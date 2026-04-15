import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

const STATUS_LABELS = {
  creada:    { label: 'Creada',     cls: 'badge-creada' },
  aprobada:  { label: 'Aprobada',   cls: 'badge-aprobada' },
  pagada:    { label: 'Pagada',     cls: 'badge-pagada' },
  entregada: { label: 'Entregada',  cls: 'badge-entregada' },
  anulada:   { label: 'Anulada',    cls: 'badge-anulada' },
}

const TABS = [
  { key: 'todas',     label: 'Todas' },
  { key: 'creada',    label: 'Creadas' },
  { key: 'aprobada',  label: 'Aprobadas' },
  { key: 'pagada',    label: 'Pagadas' },
  { key: 'entregada', label: 'Entregadas' },
  { key: 'anulada',   label: 'Anuladas' },
]

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('todas')

  useEffect(() => {
    api.get('/sales/orders/')
      .then(({ data }) => setOrders(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Filtrado en cliente (los datos ya vienen ordenados por -created_at desde el backend)
  const filtered = activeTab === 'todas'
    ? orders
    : orders.filter((o) => o.status === activeTab)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amazon-orange" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Mis Pedidos</h1>

      {/* Tabs de estado */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {TABS.map(({ key, label }) => {
          const count = key === 'todas'
            ? orders.length
            : orders.filter((o) => o.status === key).length
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-amazon-orange text-amazon-orange'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === key ? 'bg-amazon-orange text-amazon-blue' : 'bg-gray-200 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista de pedidos */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          {orders.length === 0 ? (
            <>
              <p className="text-lg mb-4">No tenés pedidos todavía.</p>
              <Link to="/" className="btn-primary">Ir a la tienda</Link>
            </>
          ) : (
            <p className="text-lg">No hay pedidos en estado "{STATUS_LABELS[activeTab]?.label || activeTab}".</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const status = STATUS_LABELS[order.status] || { label: order.status, cls: 'badge' }
            const date = new Date(order.created_at).toLocaleString('es-AR', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="card flex items-center justify-between p-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-gray-800">Pedido #{order.id}</p>
                  <p className="text-xs text-gray-500">{date}</p>
                  <p className="text-xs text-gray-500">
                    {order.item_count} producto{order.item_count !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <span className={status.cls}>{status.label}</span>
                  <p className="font-bold text-gray-800">${parseFloat(order.final_price).toFixed(2)}</p>
                  {parseFloat(order.discount) > 0 && (
                    <p className="text-xs text-green-600">-${parseFloat(order.discount).toFixed(2)} desc.</p>
                  )}
                  <span className="text-xs text-amazon-teal">Ver detalle →</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
